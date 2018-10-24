系统名称
============

关于
---------
本系统由[orochi](https://git.jiliguala.la/djy-fe/orochi)作为服务端框架,[ANT DESIGN](https://ant.design/index-cn)作为客户端框架进行开发.


构建
---------
```
cvms start
npm run build
```

> 在测试环境时,会生成非压缩的文件
> 在其他环境,会生成压缩的文件

启动
---------
```
npm start
```
或使用`pm2`启动`ua.json`

dubbo API文档地址
---------
- 支付API: [http://doc.jiliguala.la/display/API/jlgl-biaoju-pay](http://doc.jiliguala.la/display/API/jlgl-biaoju-pay)
- 订单API: [http://doc.jiliguala.la/display/API/java-djy-order-api](http://doc.jiliguala.la/display/API/java-djy-order-api)
- boss权限API: [http://doc.jiliguala.la/pages/viewpage.action?pageId=12358466](http://doc.jiliguala.la/pages/viewpage.action?pageId=12358466)

访问地址
---------
请参考[app/build/router.jsx](app/build/router.jsx)

鉴权地址
---------
请参考[auth.json](auth.json)

> 特殊权限请参考[docs/特殊权限规则.md](docs/特殊权限规则.md)