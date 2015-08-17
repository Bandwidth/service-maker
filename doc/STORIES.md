# User Stories

## `I` Creating a new Instance

### `Ia` With default AMI and instance type
1. The User wants to create a new instance, with a default AMI, instance size and security group.

2. The User posts to `/v1/instances` with no payload.

3. The user receives a response:
```
201 Created
Location: https://my-servicemaker.com/v1/instances/instanceId1
{
    "id"       : "instanceId1",
    "type"     : "t2.micro",
    "ami"      : "ami-d05e75b8",
    "state"    : "pending",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
}
```
4. The user begins polling on `https://my-servicemaker.com/v1/instances/instanceId1` until the resource `state` changes to `ready`.
When the user polls the above link, service maker checks if it is possible to SSH into the newly created instance and updates
the state. Service maker stores the retrieved state in cache for 10 seconds.

5. The user begins using his new EC2 instance.

### `Ib` With a valid AMI and the default instance type and security group.
1. The User wants to create a new instance, provisioned with the `ami-myapp` image.

2. The User posts to `/v1/instances` with the payload:
```
  {
    "ami" : "ami-myapp"
  }
```

3. The user receives a response:
```
201 Created
Location: https://my-servicemaker.com/v1/instances/instanceId1
{
    "id"       : "instanceId1",
    "type"     : "t2.micro",
    "ami"      : "ami-myapp",
    "state"    : "pending",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
}
```

4. The user begins polling on `https://my-servicemaker.com/v1/instances/instanceId1` until the resource `state` changes to `ready`.

5. The user begins using her new EC2 instance.

### `Ic` With a valid AMI and a specified instance type
1. The User wants to create a new `m1.medium` instance, provisioned with the `ami-myapp` image.

2. The User posts to `/v1/instances` with the payload:
```
  {
    "ami"  : "ami-myapp",
    "type" : "m1.medium"
  }
```

3. The user receives a response:
```
201 Created
Location: https://my-servicemaker.com/v1/instances/instanceId1
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "pending",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

4. The user begins polling on `https://my-servicemaker.com/v1/instances/instanceId1` until the resource `state` changes to `ready`.

5. The user begins using his new EC2 instance.

### `Id` With a valid AMI, specified instance type and an existing security group
1. The User wants to create a new `m1.medium` instance, provisioned with the `ami-myapp` image and using an existing security group `security-group`.

2. The User posts to `/v1/instances` with the payload:
```
  {
    "ami"           : "ami-myapp",
    "type"          : "m1.medium",
    "securityGroup" : "security-group"
  }
```

3. The user receives a response:
```
201 Created
Location: https://my-servicemaker.com/v1/instances/instanceId1
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "pending",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

4. The user begins polling on `https://my-servicemaker.com/v1/instances/instanceId1` until the resource `state` changes to `ready`.

5. The user begins using his new EC2 instance.

### `Ie` With an invalid AMI
1. The User wants to create a new instance, provisioned with the `ami-invalid` image, which does not exist.

2. The User posts to `/v1/instances` with the payload:
```
  {
    "ami" : "ami-invalid"
  }
```

3. The User receives a response:
```
400 Bad Request
  {
    "message" : "The specified AMI does not exist."
  }
```

### `If` With an invalid instance type
1. The User wants to create a new instance, provisioned with the `ami-myapp` image, with the nonexistent `z1.gigantic` instance type.

2. The User posts to `/v1/instances` with the payload:
```
  {
    "ami"  : "ami-myapp",
    "type" : "z1.gigantic"
  }
```

3. The User receives a response:
```
400 Bad Request
  {
    "message" : "The specified instance type does not exist."
  }
```

## `II` Getting existing instance details

### `IIa` Of all the instances
1. The User wants to get the details of all existing instances

2. The User makes a `GET` request to `v1/instances` with no parameters passed.

3. The User receives a response
```
200 OK
  {
    instances : [

    {
      "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "pending",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    },

    {
      "id"       : "instanceId2",
      "type"     : "t2.micro",
      "ami"      : "ami-default",
      "state"    : "ready",
      "uri"      : "https://ec2-127-0-0-2.compute-1.amazonaws.com",
      "revision" : 2
    },

    {
      "id"       : "instanceId3",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "stopped",
      "uri"      : "https://ec2-127-0-0-3.compute-1.amazonaws.com",
      "revision" : 6
    } ]
  }
```

## `IIb` When no instances exist
1. The User wants to get details of all existing instances.

2. The User makes a `GET` request to `v1/instances`.

3. The User receives a response
```
404 Not Found
```

## `IIc` Of an instance with a certain id
1. The User wants to get the details of an instance with a particular id

2. The User makes a `GET` request to `v1/instances/instanceId1`.

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "pending",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    } ]
  }
```

## `IId` Of all instances of a certain type
1. The User wants to get the details of all instances of a certain type

2. The User makes a `GET` request to `v1/instances?type=t2.micro` with no parameters passed.

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "t2.micro",
      "ami"      : "ami-myapp",
      "state"    : "pending",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    },

    {
      "id"       : "instanceId2",
      "type"     : "t2.micro",
      "ami"      : "ami-myapp",
      "state"    : "running",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 5
    },

    {
      "id"       : "instanceId3",
      "type"     : "t2.micro",
      "ami"      : "ami-default",
      "state"    : "stopped",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 3
    } ]
  }
```

## `IIe` Of all instances of a certain type when none exist
1. The User wants to get the details of all instances of a certain type

2. The User makes a `GET` request to `v1/instances?type=t2.micro` with no parameters passed.

3. The User receives a response
```
404 Not Found
```

## `IIf` Of all instances of a certain type and AMI
1. The User wants to get the details of all instances of type `t2.micro`

2. The User makes a `GET` request to `v1/instances?type=t2.micro&ami-ami-myapp` with no parameters passed.

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "t2.micro",
      "ami"      : "ami-myapp",
      "state"    : "pending",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    },

    {
      "id"       : "instanceId2",
      "type"     : "t2.micro",
      "ami"      : "ami-myapp",
      "state"    : "running",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 5
    } ]
  }
```

## `IIg` Of all instances of a certain type, state and AMI
1. The User wants to get the details of all instances of type `t2.micro`

2. The User makes a `GET` request to `v1/instances?type=t2.micro&ami=ami-myapp&state=pending` with no parameters passed.

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "t2.micro",
      "ami"      : "ami-myapp",
      "state"    : "pending",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    } ]
  }
```

## `IIh` Of all instances of a certain type, AMI, state and URI
1. The User wants to get the details of all instances of type `t2.micro`

2. The User makes a `GET` request to `v1/instances?type=t2.micro&ami=ami-myapp&state=pending` with no parameters passed.

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "t2.micro",
      "ami"      : "ami-myapp",
      "state"    : "pending",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    } ]
  }
```

## III Updating the status of an existing instance

### `IIIa` Stopping the instance
1. The User wants to stop an instance whose id instanceId1

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the payload
```
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "stopping",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "stopping",
      "uri"      : null,
      "revision" : 1
    } ]
  }
```

4. After the instance is stopped on EC2, the User makes a `GET` request to `v1/instances/instanceId1` with no parameters.

5. The User receives a response
```
200 OK
{
  instances : [
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "stopped",
    "uri"      : null,
    "revision" : 2
  } ]
}
```

### `IIIb` Terminating the instance
1. The User wants to terminate an instance whose id is instanceId1

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the payload
```
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "terminating",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "terminating",
      "uri"      : null,
      "revision" : 1
    } ]
  }
```

4. After the instance is terminated on EC2, the User makes a `GET` request to `v1/instances/instanceId1` with no parameters.

5. The User receives a response
```
200 OK
  {
    instances : [
    {
     "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "terminated",
      "uri"      : null,
      "revision" : 2
    } ]
  }
```

### `IIIc` Starting the instance
1. The User wants to start an instance whose id is instanceId1

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the payload
```
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "running",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "stopping",
      "uri"      : null,
      "revision" : 1
    } ]
  }
```

4. After the instance is stopped on EC2, the User makes a `GET` request to `v1/instances/instanceId1`.

5. The User receives a response
```
200 OK
  {
    instances : [
    {
     "id"       : "instanceId1",
      "type"     : "m1.medium",
      "ami"      : "ami-myapp",
      "state"    : "stopped",
      "uri"      : null,
      "revision" : 2
    } ]
  }
```

### `IIId` Setting the state to something that is not permitted
1. The User wants to set the state of an instance to starting

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the payload
```
  {
    "id"       : "instanceId1",
    "type"     : "m1.medium",
    "ami"      : "ami-myapp",
    "state"    : "starting",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
400 Bad Request
```

### `IIIe` Sending an invalid payload
1. The User wants to stop a running instance with id instanceId1

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the invalid payload
```
  {
    "id"       : "instanceId1",
    "type"     : [ "m1.medium" ],
    "ami"      : "ami-myapp",
    "state"    : "running",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
400 Bad Request
```

### `IIIf` Tries to carry out an action that is not supported
1. The User wants to set the state of an instance to `failed`

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the invalid payload
```
  {
    "id"       : "instanceId1",
    "type"     : [ "m1.medium" ],
    "ami"      : "ami-myapp",
    "state"    : "failed",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
400 Bad Request
```

### `IIIg` Sending an invalid payload
1. The User wants to stop a running instance with a particular id

2. The User makes a `PUT` request to `v1/instances/instanceId1` with the invalid payload
```
  {
    "id"       : "instanceId1",
    "type"     : [ "m1.medium" ],
    "ami"      : "ami-myapp",
    "state"    : "running",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
400 Bad Request
```

### `IIIh` Making a request with an outdated document
1. The User wants to start/stop/terminate an instance with a particular id

2. The User makes a `PUT` request to `v1/instances/instanceId1` with an incorrect revision in the payload
```
  {
    "id"       : "instanceId1",
    "type"     : [ "m1.medium" ],
    "ami"      : "ami-myapp",
    "state"    : "running",
    "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
    "revision" : 0
  }
```

3. The User receives a response
```
409 Concurrency Error
```

## `IV` Terminating an instance

### `IVa` When the instance exists.
1. The User wants to terminate an instance with a particular id

2. The User makes a `DELETE` request to `v1/instances/instanceId1`.

3. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : [ "m1.medium" ],
      "ami"      : "ami-myapp",
      "state"    : "terminating",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 1
    }]
  }
```

4. The User makes a `GET` request once the instance has been terminated.

5. The User receives a response
```
200 OK
  {
    instances : [
    {
      "id"       : "instanceId1",
      "type"     : [ "m1.medium" ],
      "ami"      : "ami-myapp",
      "state"    : "terminated",
      "uri"      : "https://ec2-127-0-0-1.compute-1.amazonaws.com",
      "revision" : 2
    }]
  }
```

### `IVb` When the instance does not exist.
1. The User wants to terminate an instance with a particular id

2. The User makes a `DELETE` request to `v1/instances/instanceId1`.

3. The User receives a response
```
404 Not Found
```
