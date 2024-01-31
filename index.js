const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS to allow cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Fetch and Downsample Data API
app.get('/api/data', async (req, res) => {
    try {
        // Read CSV file and convert to JSON
        const file = path.join(process.cwd(), 'public', 'dataset.csv');
        const rawData = await readCSVFile(file);

        // Max Value Downsample the data
        const downsampledData = maxDownsample(rawData, 100); // Adjust threshold as needed

        res.json(downsampledData);
    } catch (error) {
        console.error('Error fetching or downsampling data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Max Value Downsampling Function
const maxDownsample = (data, threshold) => {
    const result = [];
    const segmentSize = Math.ceil(data.length / threshold);

    for (let i = 0; i < data.length; i += segmentSize) {
        const segment = data.slice(i, i + segmentSize);
        const maxProfit = Math.max(...segment.map((entry) => entry['Profit Percentage']));

        result.push({ ts: segment[0].Timestamp, 'pp': maxProfit.toPrecision(4) });
    }

    return result;
};

const readCSVFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        const data = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                data.push(row);
            })
            .on('end', () => {
                resolve(data);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});