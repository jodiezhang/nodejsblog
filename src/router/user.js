const { login } = require('../controller/user')
const { SuccessModel, ErrorModel} = require('../model/resModel')
const { set,get } = require('../db/redis')


const handleUserRouter = (req,res) => {
    const method = req.method //GET POST

    //登录
    if (method === 'POST' && req.path === '/api/user/login') {
        const { username, password } = req.body //post 获取请求的方式
        //const { username,password } = req.query
        const result = login(username, password)
        return result.then(data => {
            if (data.username) {
                //设置session
                req.session.username = data.username
                req.session.realname = data.realname
                //同步到redis
                set(req.sessionId,req.session)

                return new SuccessModel({
                    username:data.username
                })
            }
            return new ErrorModel('登录失败')
        })
        
    }

    //登录验证的测试
    // if (method === 'GET' && req.path === '/api/user/login-test') {
    //     if (req.session.username) { 
    //         return Promise.resolve(new SuccessModel({
    //             session:req.session
    //         }))
    //     } else {
    //         return Promise.resolve(new ErrorModel('尚未登录'))
    //     }
    // }
}

module.exports = handleUserRouter