class apiError extends Error{
    constructor(statuscode,message,error=[],stack=''){
        super(message)
        this.message=message
        this.statuscode=statuscode
        this.error=error
        this.data=null
        this.success=false
        if (stack) {
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}












export {apiError}