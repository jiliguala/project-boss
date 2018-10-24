'use strict';
/**
 * 验证boss登录
 * @see: http://1024.bjren123.com/question/92
 * @config: 
 * - boss.URI[String] 设置boss的跳转域名,如果不设置,则默认使用baseURI
 * - boss.useSSO[String] 使用单点登录模式
 * - boss.wechatId[Number] 企业微信应用号的ID(和`AppId`配置冲突,优先读取`wechatId`).当设置该值时,默认使用微信验证
 * - boss.AppId[String] APP ID
 * - boss.AppKey[String] App密钥
 * - boss.AppName[String] APP名称
 * - boss.filterList[Array] 过滤的地址
 */
const server = require('@jlgl/orochi');
const querystring = require('querystring');
const minimatch = require('minimatch');
const config = server.config;
// 使用mock模式或正常模式
const apiClient = config.mock ? require('@jlgl/api-gateway-mock') : require('@jlgl/orochi-gateway');

const sessionMid = require('../session');

const log = server.logger;
const bossConfig = config.boss || {};

// 检测配置
// 必须有appID或wechatId
if(!(bossConfig.appId || bossConfig.wechatId)) {
    throw new Error('请指定正确的BOSS APP ID或WECHAT ID');
}
// 当有appID时,必须有appKey
if(bossConfig.appId && !bossConfig.appKey) {
    throw new Error('请指定正确的APP key');
}

// 当有wechatId
if(bossConfig.wechatId && !bossConfig.wechatKey) {
    throw new Error('请指定正确的WECHAT APP key');
}

// 替换uri域名
let bossURI = config.baseURI;
if(bossConfig.URI) {
    bossURI = bossConfig.URI;
}

// 检测微信配置并注册微信验证API
if(bossConfig.wechatId) {
    apiClient.registerHttpApi({
        'bossWechatValid': {
            server: `[{host: "bossweixin.${bossURI}", port: 80}]`,
            path: '/index/GetloginInfov3/',
            method: 'get',
            mock: function(data) {
                if(data.key !== 'test') return '/http/bossWechatSuccess';
                return '/http/bossWechatFail';
            }
        }
    });
}

let filterList = ['/zbjcheck'];
if(bossConfig.filterList && Array.isArray(bossConfig.filterList)) {
    filterList = filterList.concat(bossConfig.filterList);
}

/**
 * 判断当前是否为ajax请求
 * @param req
 * @returns {boolean}
 */
function isAjaxRequest(req) {
    let requestType = req.headers['X-Requested-With'] || req.headers['x-requested-with'];
    let acceptType = req.headers['Accept'] || req.headers['accept'];
    return {
        result: requestType === 'XMLHttpRequest',
        needJson: requestType === 'XMLHttpRequest' && /application\/json/.test(acceptType)
    };
}

/**
 * 判断当前是否为微信环境
 * @param req
 * @returns {boolean}
 */
function isWechat(req) {
    const ua = (req.header('User-Agent') || '').toLowerCase();
    return ua.indexOf('micromessenger') >= 0 || ua.indexOf('wxwork') >= 0;
}

function md5(str) {
    const md5sum = require('crypto').createHash('md5');
    md5sum.update(str);
    return md5sum.digest('hex');
}

/**
 * authcode解密方法
 * @param  {String} str 加密串
 * @param  {String} key 密钥
 * @return {String}     解密后字符串
 */
function decode(str, key) {
    key = key ? md5(key) : md5('');

    var ckey_length = 4;

    var keya = md5(key.substr(0, 16));

    var keyb = md5(key.substr(16, 16));

    var keyc = ckey_length ? str.substr(0, ckey_length) : '';

    var cryptkey = keya + md5(keya + keyc);

    str = str.substr(ckey_length);
    let strbuf = new Buffer(str, 'base64');
    

    let box = [];
    for (let i = 0; i < 256; i++) {
        box[i]  = i;
    }
    let rndkey = [];
    for (let i = 0; i < 256; i++) {
        rndkey[i]  = cryptkey.charCodeAt(i % cryptkey.length);
    }
    for (let j = 0, i = 0; i < 256; i++) {
        j = (j + box[i]  + rndkey[i] ) % 256;
        let tmp = box[i] ;
        box[i]  = box[j] ;
        box[j]  = tmp;
    }


    for (let a = 0, j = 0, i = 0; i < strbuf.length; i++) {
        a = (a + 1) % 256;
        j = (j + box[a] ) % 256;
        let tmp = box[a] ;
        box[a]  = box[j] ;
        box[j]  = tmp;
        strbuf[i]  = strbuf[i]  ^ (box[(box[a]  + box[j] ) % 256]);
    }

    let s = strbuf.toString();
    if(s.substr(0, 10) - time(new Date()) < 0) {
        log.info('code时间过期,有可能是boss服务器时间与当前node服务器时间差距大于1分钟');
    }
    if ((s.substr(0, 10) == 0 || s.substr(0, 10) - time(new Date()) > 0) && s.substr(10, 16) == md5(s.substr(26) + keyb).substr(0, 16)) {
        s = s.substr(26);
    } else {
        s = '';
    }
    return s;
}

/**
 * 获取boss跳转地址
 * @param  {Object} req 请求对象
 * @return {String}     boss跳转地址
 */
function getBossUrl(req, type) {
    let loginPath = 'cp-dirlogin';
    const protocol = bossConfig.protocol || 'https:';
    let url = protocol + '//' + req.headers.host + req.originalUrl;
    if(bossConfig.useSSO) {
        loginPath = 'cp-ssologin';
    }
    switch(type) {
    case 'login':
        if(bossConfig.wechatId && isWechat(req)) {
            url = protocol + '//' + req.headers.host + '/user/login/?path=' + encodeURIComponent(req.originalUrl);
            return `http://bossweixin.${bossURI}/index/ssoSignin?agent_id=${bossConfig.wechatId}&redirect_uri=${encodeURIComponent(url)}`;
        }
        return `https://bosslogin.${bossURI}/${loginPath}?appid=${bossConfig.appId}&back_url=${encodeURIComponent(url)}`;
    case 'logout':
        // return `${protocol}//bosslogin.${bossURI}/cp-logout`;
        return '/';
    default:
        return '';
    }
}

/**
 * 获取10位时间戳
 * @param  {String} date 时间格式
 * @return {Number}      10位时间戳
 */
function time(date) {
    if(date) {
        date = new Date(date);
    }else{
        date = new Date();
    }
    return Math.floor(date.getTime() / 1000);
}

/**
 * 检查用户登录情况
 * @param  {Object}   req  请求对象
 * @param  {Object}   res  响应对象
 * @param  {Function} next 下一步函数
 */
exports.checkUser = function(req, res, next) {
    const path = req.originalUrl;
    const checkUrl = path.replace(/\?\S+/, '');
    const bossuid = req.session.bossuid;
    if(!bossuid) {
        if(!filterList.some(function(filterPath) {
            return minimatch(checkUrl, filterPath);
        })) {
            const isAjax = isAjaxRequest(req);
            if(isAjax.result) {
                let error = new Error('尚未登录boss系统或登录过期,请刷新页面重新登录');
                error.code = 401;
                return next(error);
            }
            return res.redirect(getBossUrl(req, 'login'));
        }
    }
    next();
};

/**
 * 检查用户登录码信息并写入session
 * @param  {Object}   req  请求对象
 * @param  {Object}   res  响应对象
 * @param  {Function} next 下一步函数
 */
exports.checkCode = function(req, res, next) {
    let PromiseFunc = bossConfig.wechatId && isWechat(req) ? getWechatInfo(req) : getBossInfo(req);
    PromiseFunc
        .then(function(backUrl) {
            sessionMid.save(req, res, function(err) {
                if(err) return next(err);
                res.redirect(backUrl);
            });
        })
        .catch(next);
};

/**
 * 获取boss信息
 * @param  {Object}   req 请求对象
 * @return {Function}     Promise函数
 */
function getBossInfo(req) {
    return new Promise(function(resolve, reject) {
        const code = decodeURIComponent(req.query.code);
        const backUrl = req.query.back_url;
        if(!code || !backUrl) {
            let error = new Error('无效的登录返回信息');
            error.code = 401;
            return reject(error);
        }
        const authString = decode(code, bossConfig.appKey);
        const authObj = querystring.parse(authString);
        if(!authObj.user_id) {
            let error = new Error('登录信息获取错误');
            error.code = 401;
            return reject(error);
        }
        req.session.bossuid = authObj.user_id;
        req.session.username = authObj.username;
        req.session.email = authObj.email;
        resolve(backUrl);
    });
}

function getWechatInfo(req) {
    const key = req.query.key;
    const backUrl = req.query.path;
    return new Promise(function(resolve, reject) {
        if(!key || !backUrl) {
            let error = new Error('无效的登录返回信息');
            error.code = 401;
            return reject(error);
        }
        resolve();
    })
        .then(function() {
            return apiClient.http.bossWechatValid.get({
                'key': key
            });
        })
        .then(function(data) {
            if(data.success === false) {
                let error = new Error(data.msg);
                error.code = 401;
                return Promise.reject(error);
            }
            return decode(data.code, bossConfig.wechatKey);
        })
        .then(function(authString) {
            const authObj = JSON.parse(authString);
            log.debug('========获取微信认证信息成功========');
            log.debug(authObj);
            if(!authObj.user_id) {
                let error = new Error('登录信息获取错误');
                error.code = 401;
                return Promise.reject(error);
            }
            req.session.bossuid = authObj.user_id;
            req.session.username = authObj.username;
            req.session.email = authObj.email && authObj.email !== 'null' ? authObj.email : '';
            return Promise.resolve(backUrl);
        });
}

/**
 * 登出
 * @param  {Object}   req  请求对象
 * @param  {Object}   res  响应对象
 * @param  {Function} next 下一步函数
 */
exports.logout = function(req, res, next) {
    sessionMid.clear(req, res, function(err) {
        if(err) return next(err);
        res.redirect(getBossUrl(req, 'logout'));
    });
};