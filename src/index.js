/*			INPRES CLI
 *
 *    This software gets the last 30 days seismics
 *    reports updated by INPRES (Instituto Nacional
 *    de la Prevención Sísmica in CSV, applyes some
 *    style and post it to be getted by (f.e.) CURL
 *
 *    I'm not involved at INPRES or another seismic
 *    institute
 *
 *    Program licensed under GNU GPL v3.0, see LICENSE
 */

/*
 *    Defining and configuration
 */

const express = require("express");
const axios = require("axios");
const csv = require("csv-parser");
const Table = require("cli-table");

const csv_url = 'http://contenidos.inpres.gob.ar/formatos/sismos30d.csv';
const server_port = 3000;
/*
 *    Server
 */

const app = express();

app.get('/', async(req, res) => {
    try {
        res.send(`ÚLTIMOS SISMOS REPORTADOS - INPRES\n${await send_table()}\n`);
    } catch(error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(server_port, () => {
    console.log(`Servidor en ejecución en http://localhost:${server_port}`);
});

/*
 *    Functions
 */

async function get_reports() {
    try {
        const inpres_data_csv = await axios.get(csv_url, { responseType: 'stream' }); // 'responseType' debe ser 'stream'

        return new Promise((resolve, reject) => {
            const reports = [];

            inpres_data_csv.data
                .pipe(csv())
                .on('data', (row) => {
                    reports.push([row.Datetime, row.Region, row.Magnitude]);
                })
                .on('end', () => {
                    resolve(reports);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    } catch (error) {
        console.error(error);
        return false;
    }
}

function data_to_table(data) {
    if(!data) return console.error("Hubo un error al obtener la información.")

    var table = new Table({
        head: ["Fecha", "Lugar", "Magnitúd"]
    });

    data.forEach((row) => {
        table.push(row);
    })

   return table;
}

async function send_table() {
    var data = await get_reports();
    var table = await data_to_table(data);

    return table.toString();
}

