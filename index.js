const bodyParser = require('body-parser')
const express = require('express')
const fs = require('fs')
const moment = require('moment')


const app = express()

const PORT = 3000

app.use(bodyParser.json({ type: 'application/json' }))
app.use('/', express.static('public'))

app.get('/data/:name', (req, res) => {
    const fileName = req.params.name
    fs.readFile(`./data/${fileName}.json`, function(err, data) {
        if (err) res.status(400).json({ error: err })
        res.send (JSON.parse(data))
    });
})

app.put('/data/:name', (req, res) => {
    const fileName = req.params.name
    fs.writeFile(`./data/${fileName}.json`, JSON.stringify(req.body.tables, null, 4), (err) => {
        if (err) res.status(400).json({ error: err })
        res.send (req.body)
    });
})

app.post('/data/:name', (req, res) => {
    const fileName = req.params.name
    fs.writeFile(`./data/${fileName}.json`, JSON.stringify(req.body.tables, null, 4), (err) => {
        if (err) {
            res.status(400).json({ error: err })
            return
        }
        const services = findServices(req.body.tables)
        const dir = `${fileName}-${moment().format()}`
        fs.mkdir(`./sql/${dir}`, { recursive: true }, (err) => {
            if (err) {
                res.status(400).json({ error: err })
                return
            }

            const hasErr = services.reduce ((hasErr, service) => {
                fs.writeFile(`./sql/${dir}/${service}.sql`, generateSql(req.body.tables, service), (err) => {
                    if (err && !hasErr) {
                        res.status(400).json({ error: err })
                        hasErr = true
                    }
                })

                fs.writeFile(`./sql/${dir}/delete-${service}.sql`, generateDeleteSql(req.body.tables, service), (err) => {
                    if (err && !hasErr) {
                        res.status(400).json({ error: err })
                        hasErr = true
                    }
                })

                return hasErr
            }, false)

            if (!hasErr) {
                res.send (req.body)
            }
        })
    })
})

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`))

const generateSql = (json, service) => {
    return json.filter(table => table.service == service).reduce((sql, table) => {
        if (table.values.length == 0) {
            return sql
        }

        const columnsSql = table.columns.map(column => column.name).join()

        const mapValues = table.values.map(values => {
            const mapValue = values.map((value, index) => {
                const column = table.columns[index]
                if (column.has_ref) {
                    const ref = json.find(t => t.table_name == column.ref.table && t.service == column.ref.service)
                    const refColumnIndex = ref.columns.findIndex(c => c.name == column.ref.column)
                    return ref.values[value.ref_row][refColumnIndex].value
                } else {
                    return value.value
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


const findServices = (json) => {
    return json.reduce((services, table) => {
        if (!services.includes(table.service)) {
            services.push(table.service)
        }
        return services
    }, [])
}

const generateDeleteSql = (json, service) => {
    return json.filter(table => table.service == service).reverse().reduce((sql, table) => {
        if (table.values.length == 0) {
            return sql
        }

        const deleteValues = table.values.map((values) => {
            const deleteValues = values.map((value, index) => {
                const column = table.columns[index]
                if (column.primary_key) {
                    let v = value.value

                    if (column.has_ref) {
                        const ref = json.find(t => t.table_name == column.ref.table && t.service == column.ref.service)
                        const refColumnIndex = ref.columns.findIndex(c => c.name == column.ref.column)
                        v = ref.values[value.ref_row][refColumnIndex].value
                    }

                    return `${column.name}=${v}`
                } else {
                    return null
                }
            })

            let deleteValueSql = deleteValues.filter(deleteValue => deleteValue != null).join(" AND ")
            deleteValueSql = `DELETE FROM ${table.table_name} WHERE ${deleteValueSql};\n`

            const deleteRefValues = table.tables_ref.map(table_ref => {
                const deleteRefValues = values.map((value, index) => {
                    const column = table.columns[index]
                    if (column.primary_key) {
                        table_ref_column = table_ref.columns.find (c => c.name_ref == column.name)

                        if (table_ref_column) {
                            let v = value.value

                            if (column.has_ref) {
                                const ref = json.find(t => t.table_name == column.ref.table && t.service == column.ref.service)
                                const refColumnIndex = ref.columns.findIndex(c => c.name == column.ref.column)
                                v = ref.values[value.ref_row][refColumnIndex].value
                            }

                            return `${table_ref_column.name}=${v}`
                        } else {
                            return null
                        }
                    } else {
                        return null
                    }
                })

                let deleteRefValueSql = deleteRefValues.filter(deleteValue => deleteValue != null).join(" AND ")
                return `DELETE FROM ${table_ref.table_name} WHERE ${deleteRefValueSql};\n`
            })

            return `
                ${deleteRefValues.join("\n")}
                ${deleteValueSql}
            `
        })

        return `
            ${sql}
            ${deleteValues.join("\n")}
        `
    }, '')
}