'use strict';
const server = require('@jlgl/orochi');
const app = server.app;
const log = server.logger;

const toolMod = require('../modules/tool');

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('ERROR NO PAGE FOUND');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function (err, req, res, next) {
    // 返回数据
    let params = toolMod.getErrorMsg(err, req);
    params.sids = req.sids || [];
    try {
        // 设置特殊情况下的http状态码，否则为200
        switch(params.status) {
        case 403:
        case 404:
        case 500:
            res.status(params.status);
            break;
        }
        // 判断是否需要jsonp返回
        if(req.query.callback) return res.jsonp(params);
        res.send(params);
    } catch (e) {
        log.error(e);
        next(e);
    }
});