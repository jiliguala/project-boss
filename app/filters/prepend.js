'use strict';
const server = require('@jlgl/orochi');
const app = server.app;
const log = server.logger;
const config = server.config;
const toolMod = require('../modules/tool');
const STATUS_CODE = require('../enums/status_code');
const sessionMid = require('../middlewares/session');
const bossMid = require('../middlewares/common-orochi-boss/');
const safeMid = require('../middlewares/common-orochi-safe/');

app.get('/zbjcheck', function(req, res) {
    res.send({
        status: STATUS_CODE.SUCCESS,
        msg: '获取服务器状态成功'
    });
});

if(config.boss && config.boss.open) {
    app.use(sessionMid.init, bossMid.user.checkUser, bossMid.permission.authCheck);
}
app.use(safeMid.xss, function (req, res, next) {
    if(!config.boss || !config.boss.open) {
        req.session = {
            bossuid: 5116,
            username: '杨稍月',
            token: '123456',
            email: 'yangshaoyue@jlgl.com'
        };
    }
    log.info(req.method + ' ' + req.originalUrl); //记录访问URL日志
    if(!toolMod.isObjEmpty(req.body)) {
        log.info('Body请求数据');
        log.info(toolMod.filterLimitData(req.body));
    }
    if(config.boss && config.boss.open && req.session.bossuid) {
        log.info('Boss账户信息');
        log.info((req.session.bossuid || 'guest') + ':' + (req.session.email || 'empty email info')); //记录boss账户日志
    }
    res.set('Pragma', 'no-cache');
    res.set('Cache-Control', 'no-cache');
    res.set('Expires', '0');
    next();
});