# Resource Definitions

### `Instance`

```
{
	"id"    : string,                      // a unique ID
	"type"  : string,                      // the EC2 instance type
	"ami"   : string,                      // the AMI ID for the instance.
	"state" : string [ pending | ready ],  // the state of the instance
	"uri"   : string                       // the uri location of the server
}
```

# REST API

## Instance Management

### `GET` /v1/instances<span style="opacity: 0.5">?query=args</span>
Lists all instances which have been provisioned by Service Maker. Can be queried using field names from the [instance model](#instance).

#### Returns

* `200` OK: Returns a payload which contains a list of instances in the following format:
```
{
	"instances" : [
		<Instance resources>
	]
}
```

### `POST` /v1/instances
Creates a new instance of the specified type.

#### Payload format
```
{
	"ami"           : string, // [OPTIONAL] the AMI ID for the instance. Defaults to a blank Ubuntu AMI.
	"type"          : string, // [OPTIONAL] an EC2 instance type. Defaults to t2.micro
	"securityGroup" : string  // [OPTIONAL] an EC2 security group name. Defaults to service-maker.
}
```

#### Returns

* `201` Created: Returns a description of the created instance resource according to the schema [above](#instance). The reply body will contain a `Location` header which points to the canonical location of the Instance resource.

* `400` Bad Request: Returned if the instance configuration parameters are invalid (for instance, if the specified instance type does not exist).

* `500` Internal Server Error: Returned if something else goes wrong.

### `GET` /v1/instances/<span style="opacity: 0.5">{instanceId}</span>
Describes the specified instance.

#### Returns

* `200` OK: Returns an instance resource according to the schema [above](#instance).

* `404` Not Found

### `PUT` /v1/instances/<span style="opacity: 0.5">{instanceId}</span>
Updates the specified instance. The state of an instance can be set to `pending`, `stopping` or `terminating` in order to start, stop or terminate an instance on the EC2 console.

#### Returns

* `200` OK: Returns a description of the updated instance resource according to the schema [above](#instance).

* `400` Bad Request: The updated configuration for the instance is invalid, no change has been made.

* `404` Not Found

* `409` Concurrency Error: Returned when the latest version of the document is not used.

### `DELETE` /v1/instances/<span style="opacity: 0.5">{instanceId}</span>
Terminates the specified instance.

#### Returns

* `200` OK: Returned when the resource has been deleted.

* `404` Not Found
