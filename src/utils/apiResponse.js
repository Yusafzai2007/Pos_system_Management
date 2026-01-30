class apiResponse {
  constructor(statuscode, message, data) {
    this.data = data;
    this.message = message;
    this.statuscode = statuscode;
    this.success = true;
  }
}

export { apiResponse };
