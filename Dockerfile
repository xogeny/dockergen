
# Base image
FROM node:latest

# Install yarn
# N.B. - We don't use the preferred method because it has to be implemented 
# differently on different platforms (depending on whether sudo is preset)
RUN npm install --global yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
ARG NPM_TOKEN
RUN echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc

# User specified scope of @xogeny
RUN echo 'scope=@xogeny' >> .npmrc
RUN echo '@xogeny:registry=https://registry.npmjs.org/' >> .npmrc

COPY . /usr/src/app

# Install dependencies using Yarn
RUN yarn install 

# Now get rid of the embedded "secret" used to access private repositories
RUN rm -f .npmrc

# Environment variables that can be set via 'docker run -e ...'
ENV FOO BAR

# Ports to EXPOSE
EXPOSE 3000

# NPM Scripts to run *during build*
RUN npm run compile
RUN npm run test

CMD [ "npm", "prestart" ]
