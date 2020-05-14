const express = require('express')
const fs = require('fs')


const app = express()

const PORT = 3000

app.use('/', express.static('public'))

app.get('/data/:name', (req, res) => {
    const fileName = req.params.name
    fs.readFile(`./data/${fileName}.json`, function(err, data) {
        if (err) res.status(400).json({ error: err })
        res.send (JSON.parse(data))
    });
})

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`))


const saveData = (fileName, jsonString) => {
    fs.writeFile(`${fileName}.json`, jsonString, (err) => {
        if (err) throw err;
        console.log(`${fileName}.json Saved!`);
    })
}

const jsonToSql = (json) => {
    return json.reduce((sql, table) => {
        const columnsSql = table.columns.map(column => column.name).join()

        const mapValues = table.values.map(values => {
            const mapValue = values.map((value, index) => {
                const column = table.columns[index];
                if (column.has_ref) {
                    const ref = json.find(t => t.table_name == column.ref.table)
                    console.log(ref.columns);
                    console.log( column.ref.column);
                    
                    const refColumnIndex = ref.columns.findIndex(c => c.name == column.ref.column)
                    console.log(refColumnIndex);
                    return ref.values[value.ref_row - 1][refColumnIndex].value;
                } else {
                    return value.value;
                }
            })
            return `(${mapValue.join()})`
        })

        return `
            ${sql}
            INSERT INTO ${table.table_name} (${columnsSql})
            VALUES ${mapValues.join()};
        `
    }, '')
}

const saveSql = (fileName, sql) => {
    fs.writeFile(`${fileName}.sql`, sql, (err) => {
        if (err) throw err;
        console.log(`${fileName}.sql Saved!`);
    })
}