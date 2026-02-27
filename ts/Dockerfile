FROM node:22

EXPOSE 5001

WORKDIR /usr/src/diccionario

COPY ts/package.json ts/package-lock.json /usr/src/diccionario/
COPY words.txt /words.txt
RUN npm install --save-dev

CMD ["npm", "run", "dev"]
