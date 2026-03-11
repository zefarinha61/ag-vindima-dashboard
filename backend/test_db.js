const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        console.log('Connecting to database...', dbConfig.server);
        await sql.connect(dbConfig);
        console.log('Connected!');
        const query = `
            select top 5 m.Campanha,m.DataMovimento,m.CodSocio,F.nome,A.Artigo,A.Descricao,SA.SubFamilia,SA.Descricao as DescricaoSubFamilia,A.CDU_Casta,C.Descricao as DescricaoCasta,M.PesoLiquido,M.Grau,m.processovindima,PV.Descricao as DescricaoProcesso
            from VIN_RececaoUvaMovimentos M
            inner join Fornecedores F on F.Fornecedor=M.codsocio
            inner join Artigo A on A.Artigo = M.TipoUva
            inner join Familias FA on FA.Familia=A.Familia
            inner join SubFamilias SA on SA.Familia=A.Familia and SA.SubFamilia=A.SubFamilia
            inner join Marcas MA on MA.Marca=A.Marca
            inner join VIN_Castas C on C.Codigo=A.CDU_Casta
            inner join VIN_ProcessoVindima PV on PV.Codigo=M.ProcessoVindima
            where M.DataAnulado is null
        `;
        const result = await sql.query(query);
        console.log('Query executed successfully. Found rows: ', result.recordset.length);
        console.dir(result.recordset, { depth: null, colors: true });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

testConnection();
