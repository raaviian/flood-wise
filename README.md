
# FloodWise: Flood alert and monitoring system

This project proposes an ESP8266-based Flood Alert and Monitoring System. Enhancing real-time water level reading with two different sensor and insufficient flood warning systems is the goal of the project. Real-time flood detection, continuous monitoring, and mass forum information center are among the goals. Early flood detection and hazard mitigation are effectively achieved by the system through a combination of sensors, data transmission, and alerting notification. It is important to integrate safety measures into flood management. Future work involves improving data prediction and investigating more safety measures for an all-encompassing tech strategy.



## API Reference

#### Get all items

JSON and XML Weather API and Geolocation Developer API
Designed for developers by developers, Weather API is the ultimate weather and geolocation API trusted by 410,000+ users worldwide. Integrate weather in JS Library|.

```http
  GET /api/weather
```

###API Response body, headers, and response call

```http
  http://api.weatherapi.com/v1/search.json?key=&q=Shah-Alam

  403

  {
  "Connection": "keep-alive",
  "Vary": "Accept-Encoding",
  "Content-Length": "2334",
  "Content-Type": "text/html",
  "Date": "Mon, 24 Jun 2024 01:26:25 GMT"
}

  403
```


| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key |

#### Get item

```http
  GET /api/weahter/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of item to fetch |



## Run the project server

To run this project on development

```bash
  npm run build
```

```bash
  node server.js
```


## Run Locally

Clone the project

```bash
  git clone https://link-to-project](https://github.com/raaviian/flood-wise.git
```

Go to the project directory

```bash
  cd flood-wise
```

Install dependencies

```bash
  npm install
```
```bash
  npm install nodemon
```
```bash
  npm install websocket
```
```bash
  npm install express
```
```bash
  npm install nodemailer
```
```bash
  npm install dotenv
```
```bash
  npm install cors
```
```bash
  npm install multer
```

Start the server

```bash
  node server.js
```


## Authors

- [@raaviian](https://www.github.com/raaviian)

