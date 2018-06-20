FROM node:8.1

RUN rm /usr/local/bin/yarn && rm /usr/local/bin/yarnpkg
RUN rm -rf /opt/yarn
RUN npm install -g yarn

COPY entrypoint.sh /usr/bin/entrypoint.sh

ENV PATH="/var/www/html/node_modules/.bin:${PATH}"
WORKDIR /var/www/html

ENTRYPOINT ["entrypoint.sh"]
