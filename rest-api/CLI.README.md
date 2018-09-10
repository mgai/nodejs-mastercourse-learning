# Building a CLI

## Design philosophy

Unlike the API and GUI which took the function driven design approach, the CLI program would be based on **event driven** approach, where the application would _emit_ events and to handle accordingly.

## Events

* [exit](#exit)
* [man/help](#man/help)
* [stats](#stats)
* [list users](#list-users)
* [more user info](#more-user-info)
* [list checks](#list-checks)
* [more check info](#more-check-info)
* [list logs](#list-logs)
* [more log info](#more-log-info)

### exit

Exit command would trigger program to exit.

### man/help

### stats

Response with the current system stats.

### list users

Write out line by line the users.

### more user info 
```
more user info --{userId}
```

Show additional details of the specific user.

### list checks 
```
list checks [--up|--down]
```

List out the checks with filter applied to `up` or `down` only per the command line option.

### more check info
```
more check info --{checkId}
```
Display the specific check info for the `checkId` provided.

### list logs

### more log info
```
more log info --{logId}
```
We will _decompress_ the log if the log file is compressed, and then display the content.