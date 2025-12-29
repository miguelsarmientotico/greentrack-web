FROM node:22-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm install && npm install -g @angular/cli && ng build

FROM nginx:latest
COPY ./default.conf  /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/greentrack-web/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

