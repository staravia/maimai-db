const grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
path = require('path')

function handleApiCalls(proto){
	var PROTO_PATH = path.join(__dirname + `\\..\\Secrets\\proto\\mythos\\maimai\\v0\\${proto}.proto`);
	
	var packageDefinition = protoLoader.loadSync(
		PROTO_PATH,
		{keepCase: true,
		 longs: String,
		 enums: String,
		 defaults: true,
		 oneofs: true
		});

	var return_proto = grpc.loadPackageDefinition(packageDefinition).mythos.maimai.v0;
	return return_proto
	
}
module.exports = handleApiCalls;