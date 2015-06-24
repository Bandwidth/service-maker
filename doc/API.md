# Resource Definitions

## `Pool`

```
{
	"name"     : string,            // a friendly name for record-keeping
	"id"       : string,            // a unique ID
	"strategy" : string [ naive ]   // a pooling strategy name ('naive' is currently supported)
}
```

## `Instance`

```
{
	"id" : string, // a unique ID
	"type" : string, // the EC2 instance type
	"ami" : string, // the location of the AMI
}
```

# REST API

## `GET` `/pools`
Lists all instance pools available to the user.

#### Payload
```
{
	"pools" : [
		<Pool resources>
	]
}
```

## `GET` `/pools/{poolId}`
Describes the specified pool. Returns a description of the pool according to the schema [above](#pool).

## `PUT` `/pools/{poolId}`
Updates the specified pool. Returns a description of the updated pool according to the schema [above](#pool).

## `GET` `/pools/{poolId}/instances`
Lists all instances which are provisioned and pooled in the specified pool.

#### Payload
```
{
	"instances" : [
		<Instance resources>
	]
}
```

## `POST` `/pools/{poolId}/instances`
Creates a new instance in the specified pool. Returns a description of the created instance resource according to the schema [above](#instance).

## `GET` `/pools/{poolId}/instances/{instanceId}`
Describes the specified instance resource according to the schema [above](#instance).

## `PUT` `/pools/{poolId}/instances/{instanceId}`
Updates the specified instance. Returns a description of the updated instance resource according to the schema [above](#instance).

## `DELETE` `/pools/{poolId}/instances/{instanceId}`
Terminates the specified instance.