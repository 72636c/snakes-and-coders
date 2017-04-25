# Snakes and Coders

Coding 101 with Python 3.

## Overview

`Snakes and Coders` provides a simple, web-based Python "environment" to get started with coding.

It consists of:

- A static website with a basic code editor and facilities to submit the code for execution
- An API that runs arbitrary Python code and returns execution details

**<https://www.snakesandcoders.com/>**

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

Install Monaco Editor:

```bash
cd s3
npm install monaco-editor@0.8.3
```

Update AJAX request in [**s3/main.js**](s3/main.js) to specify the correct `X-Api-Key` header and `url` for the Lambda API.

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
