import proxy from "express-http-proxy"



export const proxyWithHeaders =(serviceUrl, proxyOptions = {})=>{
    return proxy(
        serviceUrl,
        {
          ...proxyOptions,
          proxyReqOptDecorator:(proxyReqOpts, srcReq) =>{
            if(srcReq.user){
                proxyReqOpts.headers["x-user-id"]=srcReq.user.userId
            }
            return proxyReqOpts

          } 
        }

    )
}