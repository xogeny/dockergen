function template(image, npmfile, envs, exps, scripts, runcmd) {
  return `
# Base image
FROM ${image}

# Install yarn
# N.B. - We don't use the preferred method because it has to be implemented 
# differently on different platforms (depending on whether sudo is preset)
RUN npm install --global yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
ARG NPM_TOKEN
${npmfile}
COPY . /usr/src/app

# Install dependencies using Yarn
RUN yarn install 

# Now get rid of the embedded "secret" used to access private repositories
RUN rm -f .npmrc

${envs}

${exps}

${scripts}

CMD [ "npm", "${runcmd}" ]
`    
}

module.exports = {
  "template": template
}