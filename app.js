const querystring = require('querystring')
const handleBlogRouter = require('./src/router/blog')
const handleUserRouter = require('./src/router/user')

const getCookieExpires = () => {
    const d = new Date()
    d.setTime(d.getTime() + (24 * 60 * 60 * 1000))
    return d.toGMTString()
}

//session数据
const SESSION_DATA = {}

//用于处理post data
const getPostData = (req) => {
   const promise = new Promise((resolve,reject) => {
       if (req.method !== 'POST') {
           resolve({})
           return
       }
       if (req.headers['content-type'] !== 'application/json') {
           resolve({})
           return
       }
       let postData = ''
       req.on('data',chunk => {
           postData  += chunk.toString()
       })
       req.on('end', () => {
           if(!postData){
               resolve({})
           }
           resolve(
               JSON.parse(postData)
           ) 
       })

   })

   return promise
}

const serverHandle = (req, res) =>{

    //设置返回格式 JSON
    res.setHeader('Content-type','application/json')

    //获取path
    const url = req.url
    req.path = url.split('?')[0]

    //解析query
    req.query = querystring.parse(url.split('?')[1])

    //解析cookie
    req.cookie = {}
    const cookieStr = req.headers.cookie || ''
    cookieStr.split(';').forEach(
        item => {
            if(!item) {
                return
            }
            const arr = item.split('=')
            const key = arr[0].trim()
            const val = arr[1].trim()
            // console.log(key)
            // console.log(val)
            req.cookie[key] = val
        }
    )

    //解析 session
    let needSetCookie = false
    let userId = req.cookie.userId
    if (userId) { 
        if (!SESSION_DATA[userId]){
            SESSION_DATA[userId] = {}
        } 
    } else {
        needSetCookie = true
        userId = `${Date.now()}_${Math.random()}`
        SESSION_DATA[userId] = {}
    }
    req.session = SESSION_DATA[userId]
    

    //console.log('request cookie is '+req.cookie)

    //处理post data
    getPostData(req).then(postData => {
    req.body = postData
        //处理blog路由
    const blogResult = handleBlogRouter(req,res)
    if ( blogResult ) {
        blogResult.then(blogData => {
            if(needSetCookie) {
                res.setHeader('Set-Cookie',`userid=${userId};path=/;httpOnly;expires=${getCookieExpires()}`)
            }
            res.end(
                JSON.stringify(blogData)
            )
        })
        return
    }
  

     
    const userResult = handleUserRouter(req,res)
     if (userResult) {
        userResult.then(userData => {
            if(needSetCookie) {
                res.setHeader('Set-Cookie',`userid=${userId};path=/;httpOnly;expires=${getCookieExpires()}`)
            }
            res.end(
                JSON.stringify(userData)
            )
        })
        return
     }
 
     //未命中路由，返回404
    res.writeHead(404,{"Content-type":"text/plain"})
    res.write("404 Not Found\n")
    res.end()

    })

}

module.exports = serverHandle
//env: process.env.NODE_ENV