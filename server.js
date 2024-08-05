const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/media', express.static(path.join(__dirname, 'media')));

// Ruta para obtener servicios desde el archivo CSV
app.get('/api/servicios', (req, res) => {
    const filePath = path.join(__dirname, 'catalogo', 'Servicios.csv');
    const servicios = [];

    const readInterface = readline.createInterface({
        input: fs.createReadStream(filePath),
        output: process.stdout,
        console: false
    });

    readInterface.on('line', (line) => {
        const [nro, nombre] = line.split(';');
        if (nro && nombre) {
            servicios.push({ Nro: nro.trim(), Nombre: nombre.trim() });
        }
    });

    readInterface.on('close', () => {
        res.json(servicios);
    });
});

// Ruta para registrar visitas
app.post('/api/visitas', (req, res) => {
    const { servicio, fecha, medico, paciente } = req.body;

    const nuevaVisita = {
        servicio,
        fecha,
        medico,
        paciente
    };

    // Leer el archivo existente
    fs.readFile(path.join(__dirname, 'data', 'visitas.json'), 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al leer el archivo');
        }

        const visitas = JSON.parse(data || '[]');
        visitas.push(nuevaVisita);

        // Escribir de nuevo el archivo
        fs.writeFile(path.join(__dirname, 'data', 'visitas.json'), JSON.stringify(visitas, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al guardar la visita');
            }
            res.status(201).send('Visita registrada con éxito');
        });
    });
});

// Función para procesar la respuesta del servicio web de consulta
async function getReniecData(dni) {
    const response = await axios.get(`http://wsminsa.minsa.gob.pe/WSRENIEC_DNI/SerDNI.asmx/GetReniec`, {
        params: {
            strDNIAuto: dni,
            strDNICon: dni
        }
    });

    const xml = response.data;
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    // Suponiendo que el valor está en result.ArrayOfString.string
    const data = result.ArrayOfString.string;
    return {
        apellidoPaterno: data[1] || '',
        apellidoMaterno: data[2] || '',
        nombres: data[3] || ''
    };
}

// Ruta para obtener datos del médico desde el servicio web de RENIEC
app.get('/api/medicos/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        const data = await getReniecData(dni);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener los datos del médico:', error);
        res.status(500).send('Error al obtener los datos del médico');
    }
});

// Ruta para obtener datos del paciente desde el servicio web de RENIEC
app.get('/api/pacientes/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        const data = await getReniecData(dni);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener los datos del paciente:', error);
        res.status(500).send('Error al obtener los datos del paciente');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
