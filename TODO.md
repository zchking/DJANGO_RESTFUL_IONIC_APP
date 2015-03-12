- 产品列表分页

- (Done)产品筛选UI改为dropdown实现

- 产品重新筛选后不替换原来数据, 而是组合后台返回的数据前台重新筛选

- (Done)发布

- (Done)下架产品

- (Done)已下架产品重新上架

- (Done)收藏功能

- 注册

    - 输入用户名立即检查是否可用
    - 注册之后提示完善信息(可忽略)

- 信息完善

    - 发布产品要求完善信息(因为产品需要关联个人手机号)
    - 完善信息后跳回需要完善信息的页面

- 登陆/认证

    - 登陆的几种情况:

        - (Done)被动登陆: 即页面访问资源被拒绝, 切换到登陆界面,
            这种情况下需要记录当时所在的state, 登陆成功后切换回来

        - (Done)按声明登陆: 即明确配置某个state需要登陆(loginRequired),
            这种情况下登陆成功后需要切换到需要登陆的state

        - (Done)主动登陆: 用户直接进入登陆页面,
            这种情况下登陆成功后进入预设界面

        - (Done)自动登陆: 即注册后自动登陆
            这种情况下需要在自动登陆前设置全局状态, 以让登陆成功后的
            回调函数能够获知这是注册成功的第一次登陆, 进而进入对应的预设界面

    - 登陆认证单独包装成一个service, 动态维护认证状态,
        给其它controller中引用,
        目前大量相关逻辑写到了MainCtrl中了.

    - (Done)登陆之后返回之前需要登陆的页面

    - (Done)除了返回401, 403被动获知loginRequired, 还允通过stateProvider
        配置state为loginRequired

    - 调用获取token时不需要token已经存在, 认证成功自动生成并返回新token

    - 调用注销接口后直接删除token(下次再创建)

    - 获取token的接口避免再带之前记忆的Authorization

- 用户中心
    - 用户中心(我的信息(+头像),我的盘子,我的收藏,宝贝)
    - 用户仅能put/patch自己的信息

- pv记录

- (Done)产品状态: 可用状态, 标注已成交产品

- (Done)新旧程度等选项

- 前台地理定位 + 加后台IP定位

- 产品地址&用户所在地址关系处理

- 便捷通用的地区选择UI

- 图片上传/存储

    - 上传图片大小限制
    - 图片压缩,生成缩略图(客户端和服务器分别要做什么工作?)
    - 图片上传失败如何处理
    - 如果同名文件已存在,检查是否内容相同
    - 保存文件md5, 上传新文件, 检查md5是否存在
    - 图片上传未完成, 不能立即发布产品

- 进入angular view后, 数据未就绪时的页面展示

- Form validation solution

- view切换与历史

    - 登陆表单页面,发布产品页面如何不存入历史(即不可再次返回)
    - (Done)登陆的state上附加未登录才能进入的条件,
        或者进入登录视后图判断如果是登录状态则跳转到账户中心

- 客户端缓存

    - 请求缓存

    - 数据缓存

- 通过输入地址直接进入 account.detail 会跳到产品页面(排查原因)

- (Done)产品详情页面请求用户相关资源如何绕开被动的loginRequired

- (Reason found)取token接口为什么还报CSRF错误?

- (Done ugly)直接进入挂到某tab下地址, 无法返回tab初始页面

- 点击state链接(ui-sref)进入其它tab的孙页面，发现目标ctrl被执行，
    但是不能切换展示对应的tab，最终展示默认tab的内容!!!

- (Done)admin和api部署在同一个IP+端口下面, session认证会干扰token认证
    是否应该绝对避免同域部署, 还是处理干扰问题.

- FixBug:搜索modal返回上一页还不关闭