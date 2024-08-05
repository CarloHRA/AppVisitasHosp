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
    const servicios = [
        { Nro: '1', Nombre: 'ATENCION INMEDIATA' },
        { Nro: '2', Nombre: 'CARDIOLOGIA' },
        { Nro: '3', Nombre: 'CENTRO OBSTETRICO' },
        { Nro: '4', Nombre: 'CIRUGIA AMBULATORIA' },
        { Nro: '5', Nombre: 'CIRUGIA ESPECIALIDADES' },
        { Nro: '6', Nombre: 'CIRUGIA GENERAL' },
        { Nro: '7', Nombre: 'CIRUGIA PEDIATRICA' },
        { Nro: '8', Nombre: 'ENDOCRINOLOGIA' },
        { Nro: '9', Nombre: 'GASTROENTEROLOGIA' },
        { Nro: '10', Nombre: 'GINECO - OBSTETRICIA' },
        { Nro: '11', Nombre: 'GINECOLOGIA - PAB I' },
        { Nro: '12', Nombre: 'HOSPITALIZACION EN SALUD MENTAL Y ADICCIONES' },
        { Nro: '13', Nombre: 'INTERMEDIOS' },
        { Nro: '14', Nombre: 'MAT I - PAB I' },
        { Nro: '15', Nombre: 'MAT II - PAB II' },
        { Nro: '16', Nombre: 'MEDICINA ESPECIALIDADES' },
        { Nro: '17', Nombre: 'MEDICINA GENERAL' },
        { Nro: '18', Nombre: 'MEDICINA INTERNA' },
        { Nro: '19', Nombre: 'NEFROLOGIA' },
        { Nro: '20', Nombre: 'NEONATOLOGIA' },
        { Nro: '21', Nombre: 'NEUMOLOGIA' },
        { Nro: '22', Nombre: 'NEUROCIRUGIA HOSP' },
        { Nro: '23', Nombre: 'NEUROLOGIA' },
        { Nro: '24', Nombre: 'OBSERVACION CESAREA' },
        { Nro: '25', Nombre: 'OBSTETRICIA' },
        { Nro: '26', Nombre: 'PEDIATRIA ESCOLAR' },
        { Nro: '27', Nombre: 'PEDIATRIA LACTANTE' },
        { Nro: '28', Nombre: 'PEDIATRIA PRE ESCOLAR' },
        { Nro: '29', Nombre: 'REUMATOLOGIA' },
        { Nro: '30', Nombre: 'TRAUMATOLOGIA ADULTOS' },
        { Nro: '31', Nombre: 'TRAUMATOLOGIA NINOS' },
        { Nro: '32', Nombre: 'UCEO' },
        { Nro: '33', Nombre: 'UCI' },
        { Nro: '34', Nombre: 'UCIN I' },
        { Nro: '35', Nombre: 'UCIN II' },
        { Nro: '36', Nombre: 'UCIP' }
    ];

    res.json(servicios);
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
