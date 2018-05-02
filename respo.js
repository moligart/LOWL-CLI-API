const ResponseObject = (type, body, host, data) => {
    var host = host || null;
    return {
        type: type, 
        host: host, 
        body: body,
        data: data
    };
}

module.exports = ResponseObject;