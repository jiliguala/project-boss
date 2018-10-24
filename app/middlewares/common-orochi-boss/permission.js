'use strict';
/**
 * 验证boss权限中间件
 * @see: http://1024.bjren123.com/question/92
 * @config: 
 * - boss.URI[String] 设置boss的跳转域名,如果不设置,则默认使用baseURI
 * - boss.useSSO[String] 使用单点登录模式
 * - boss.AppId[String] APP ID
 * - boss.AppKey[String] App密钥
 * - boss.AppName[String] APP名称
 * - boss.filterList[Array] 过滤的地址
 * - boss.bossAuthList[Array] 
 * @auth.json "key为需要检查的页面路径" : "value为页面描述",支持glob路径形式
 */
const server = require('@jlgl/orochi');
const permissionManagerApi  = require('@dubbo/boss-permission-manager-api');
const path = require('path');
const fs = require('fs');
const minimatch = require('minimatch');

const sessionMid = require('../session');

const config = server.config;
const log = server.logger;
const bossConfig = config.boss || {};

// 检测配置
if(!bossConfig.appName) {
    throw new Error('请指定正确的BOSS APP NAME');
}

/**
 * 获取权限检查列表
 * @return {Array} 待检查列表
 */
function getAuthList() {
    // 读取需要检查权限的文件列表
    const authFilePath = path.join(server.appDir, 'auth.json');

    if(!bossConfig.bossAuthList) {
        if(fs.existsSync(authFilePath)) {
            const authObj = require(authFilePath);
            bossConfig.bossAuthList = Object.keys(authObj);
        } else {
            throw new Error('没有配置boss.bossAuthList或auth.json,不能使用权限检查');
        }
    }
    return bossConfig.bossAuthList;
}

/**
 * 获取权限列表
 * @param  {Object} req 请求对象
 * @param  {Object} res 返回对象
 * @return {Object}     Promise对象
 */
function getRCBA(req, res) {
    const userId = req.session.bossuid;
    return permissionManagerApi.authorize.getRcba.get({
        userId: userId,
        appName: bossConfig.appName
    })
        .then(function(rcba) {
            return new Promise(function(resolve, reject) {
                const rcbaList = JSON.parse(rcba.data) || {};
                log.debug('远程获取权限成功:');
                log.debug(rcbaList);

                req.session.rcba = {
                    rcbaList: rcbaList,
                    time: Date.now()
                };

                // 保存session
                sessionMid.save(req, res, function(err) {
                    if(err) return reject(err);
                    resolve();
                });
            });
        });
}

/**
 * 检查权限列表
 * @param  {Object}   req  请求对象
 * @param  {Object}   res  返回对象
 * @param  {Function} next 下一步
 */
exports.authCheck = function(req, res, next) {
    const curRcba = req.session.rcba;
    const authList = getAuthList();
    let path = req.originalUrl.split('?')[0].replace(/\/$/, '');
    log.debug('需验证地址列表');
    log.debug(authList);
    // 如果不在权限检测列表中,则忽略
    const pathValidResult = authList.some(function(authPath) {
        return minimatch(path, authPath);
    });
    if(!pathValidResult) {
        return next();
    }
    let promiseList = Promise.resolve();
    if(!curRcba) {
        promiseList = promiseList.then(function() {
            return getRCBA(req, res);
        });
    }
    promiseList.then(function() {
        return new Promise(function(resolve, reject) {
            const rcba = req.session.rcba;
            let rcbaList = rcba.rcbaList || {};
            let rcbaCheck = true;
            log.debug('验证路径', path);
            log.debug('验证路径列表');
            log.debug(rcbaList);
            const pathArr = path.substr(1).split('/');
            pathArr.every(function (item) {
                //下级再没有页面时
                if(Array.isArray(rcbaList)) {
                    log.debug('再无下级目录,默认通过');
                    return false;
                }
                if (!rcbaList[item]) {
                    log.debug('没有该级权限');
                    rcbaCheck = false;
                    return false;
                }
                rcbaList = rcbaList[item];
                return true;
            });
            log.debug('验证结果' + rcbaCheck);
            if(!rcbaCheck) {
                return reject();
            }
            next();
        });
    })
        .catch(function(err) {
            if(err) log.error(err);
            let error = new Error('无效的权限验证信息');
            error.code = 403;
            next(error);
        });
};