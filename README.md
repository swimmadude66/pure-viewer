# PuRe Viewer (**Pu**ll **Re**quest Viewer)

_Get open pull requests for any set of github users_

## Installation

Clone this repo, and run `npm install -g`

*ALTERNATIVELY*

Install from npm with `npm i -g pure-viewer` (assuming this gets published to npm *TBD*)

## Usage
Once installed globally, you can call PuRe by `pure-viewer` or its alias `prv`.

```
Usage: prv [options] [command]

  a cli-tool to display open pull requests by user


  Options:

    -v, --version              output the version number
    -u, --username <username>  Authenticate as this github user
    -p, --password             Authenticate with a password
    -t, --token                Authenticate with a github Personal Access Token
    --no-color                 Disables console output colors and style
    -h, --help                 output usage information


  Commands:

    config-set <key> <value>               Set a configuration value
    config-get [key]                       get a configuration value or all values
    config-delete [keys...]                delete a config keys
    alias-set <key> <user> [moreUsers...]  Create an alias for a group of users
    alias-get [key]                        get the value of an alias or view all
    alias-delete [keys...]                 delete aliases
    auth <username>                        Authenticate with github and save the credentials for future requests
    by-author <user> [moreUsers...]        Retrieve all open pull requests authored by the given user(s)
    by-assignee <user> [moreUsers...]      Retrieve all open pull requests assigned to the given user(s)
```

PuRe can get open pull requests by author, or asignee. The two primary commands are:

```
prv by-author author1 author2 author3 ...
prv by-assignee author1 author2 author3 ...
```
Where `author1`, `author2`, and `author3` are github usernames

## Authentication
Sometimes, users have pull requests opened against private repos, which means they will not show up in results.
However, if you have a user which can view those private repos, you can authenticate as that user to see the PR.

### Method 1 - Explicit Auth
```
prv auth username -p
prv auth username -t
```
This command will attempt to authenticate as the provided username, using the prompted password (`-p`) or token (`-t`). If the authentication succeeds, the auth header will be stored in the local config and used for future requests. You can delete the stored auth with `prv config-delete auth` if you need to.

It is advised you utilize a github [Personal Access Token](https://github.com/blog/1509-personal-api-tokens "How to use PATs") with view-repo permission granted on it, as password authentication will fail for accounts with 2FA enabled.


### Method 2 - Inline Auth
```
prv -u username -t by-author author1
prv -u username -t by-assignee author1
prv -u username -p by-author author1
prv -u username -p by-assignee author1
````
The `by-author` and `by-assignee` methods can accept auth options too, and will attempt to authenticate before making the request. If the requests succeed, the auth header will be saved and used in future requests by default.


## Advanced Usage
If you need the same group or groups of users frequently, it may be beneficial to store them in an `alias`.
```
prv alias-set my-team author1 author2
prv by-author my-team
```
prv will automatically expand aliases at run time, so you can even chain multiple aliases together
```
prv by-assignee lead-devs qa-team interns author3
```
Aliases can be overwritten with `alias-set` or deleted with `alias-delete` at any time
```
prv alias-set my-team newUser1 newUser2 newUser3
prv alias-delete my-team qa-team
```

You can also get the value of any alias using `alias-get`
```
prv alias-get my-team
```
If you do not provide an argument to `alias-get`, the entire block of known aliases will be returned

