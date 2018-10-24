'use strict';
const server = require('@jlgl/orochi');
const router = server.getRouter();
const request = require('request');

exports.rootPath = '/file';

/** 获取文件数据 */
router.get('/', function(req, res) {
    if(!(/\.pdf/.test(req.query.path))) {
        return res.redirect(req.query.path);
    }
    request(req.query.path.replace(/^\/\//, 'https://'), {
        agentOptions: {
            rejectUnauthorized: false
        }
    })
        .on('response', function(response) {
            delete response.headers['content-disposition'];
        })
        .pipe(res);
});

exports.router = router;