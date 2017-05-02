# Snakes and Coders

Coding 101 with Python 3.

## Overview

`Snakes and Coders` provides a simple, web-based Python "environment" to get started with coding.

It consists of:

- A static website with a basic code editor and facilities to submit the code for execution
- An API that runs arbitrary Python code and returns execution details

**<https://www.snakesandcoders.com/>**

## Interfaces

### Page configuration

A JSON configuration file placed in [**s3/config**](s3/config) can be loaded by passing its filename as a URL parameter, like `index.html/?<filename>`.

```json
{
  "setup": "x = 0\ny = 0\nz = {{random_z}}",
  "main": "print('Hello')",
  "tests": {
    "asserts": [
      {
        "expression": "x",
        "description": "`x` exists."
      }, {
        "expression": "x == 1",
        "description": "`x` equals 1."
      }, {
        "expression": "y == 0",
        "description": "`y` equals 0."
      }, {
        "expression": "z == {{random_z}}",
        "description": "`z` equals {{random_z}}."
      }
    ],
    "prints": {
      "positives": ["He", "Hello"],
      "negatives": ["he", "there"]
    }
  },
  "grouping": "exercise-1",
  "replacements": {
    "random": {
      "int": ["{{random_z}}"]
    }
  }
}
```

The flow of pages to navigate from and to are defined in [**s3/navigation.json**](s3/navigation.json):

```json
...

"<current-filename>": {
"prev": "<previous-filename>",
"next": "<next-filename>"
},

...
```

### API request

Requests to the API should be formatted like this:

```json
{
  "headers": {"Content-Type": "application/json"},
  "body": {
    "setup": "x = 0\ny = 0",
    "main": "print('Hello')\nx = 1",
    "tests": {
      "asserts": ["x", "x == 1", "y == 0"],
      "prints": {
        "positives": ["He", "Hello"],
        "negatives": ["he", "there"]
      }
    }
  }
}
```

### API response

When the API is able to service a request, it will respond like this:

```json
{
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "status": "OK",
    "variables": {"x": 1, "y": 0},
    "stdout": "Hello\\n",
    "tests": {
      "asserts": [true, true, true],
      "prints": {
        "positives": [true, true],
        "negatives": [true, true]
      }
    }
  },
  "statusCode": 200
}
```

The following status codes may be returned:

- 200 OK: request was serviced and code executed successfully
- 400 Bad Request: request was serviced but code execution failed
- 502 Bad Gateway: request was unhandled, causing an error on `Access-Control-Allow-Origin`

## Deployment

### Prerequisites

Sign up for an [**AWS**](https://aws.amazon.com/) account.

Install [**Node.js and npm**](https://nodejs.org/).

### Lambda API

#### Create Lambda function

Upload [**lambda/lambda_function.py**](lambda/lambda_function.py) to AWS Lambda.

#### Trigger with API Gateway

Create resource with POST method to trigger the Lambda function.

Create API key and associate with POST method.

Enable CORS:

Option                       | Value
:--                          | :--
Access-Control-Allow-Headers | 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Invocation-Type,X-Amz-Security-Token'
Access-Control-Allow-Origin  | '*'

Deploy API.

### Static website

#### Register custom domain

Register domain name, e.g. `domain.tld`, via Route 53.

Request SSL certificates `domain.tld` and `www.domain.tld` with ACM.

#### Package assets

Install jQuery and Monaco Editor:

```bash
cd s3
npm install jquery monaco-editor
```

Update `API_URL` and `API_KEY` variables in [**s3/main.js**](s3/main.js) to point to the Lambda API.

Update [**s3-nonwww/index.html**](s3-nonwww/index.html) and [**s3-nonwww/redirection.xml**](s3-nonwww/redirection.xml) to point to `https://www.domain.tld`.

#### Host assets on S3

Create primary S3 bucket, e.g. `domain`:

- Upload contents of the [**s3**](s3) directory
- Configure for static website hosting
- Configure public permissions

Create redirect S3 bucket, e.g. `domain-nonwww`:

- Upload [**s3-nonwww/index.html**](s3-nonwww/index.html)
- Configure for static website hosting
- Configure redirection rules per [**s3-nonwww/redirection.xml**](s3-nonwww/redirection.xml)
- Configure public permissions

#### Publish to custom domain via CDN

Create primary CloudFront distribution:

- CNAME: `www.domain.tld`
- Origin: `domain.s3.amazonaws.com`
- SSL Certificate: `www.domain.tld`
- Viewer Protocol Policy: Redirect HTTP to HTTPS

Create redirect CloudFront distribution:

- CNAME: `domain.tld`
- Origin: `domain-nonwww.s3-website-<region>.amazonaws.com`
- SSL Certificate: `domain.tld`
- Viewer Protocol Policy: Redirect HTTP to HTTPS

Create Route 53 hosted zone record sets:

- `www.domain.tld`: A and AAAA aliased to primary CloudFront distribution
- `domain.tld`: A and AAAA aliased to redirect CloudFront distribution
