export interface RececaoUva {
    Campanha: string;
    DataMovimento: string;
    CodSocio: string;
    nome: string;
    Artigo: string;
    Descricao: string;
    SubFamilia: string;
    DescricaoSubFamilia: string;
    CDU_Casta: string;
    DescricaoCasta: string;
    PesoLiquido: number;
    Grau: number;
    processovindima: string;
    DescricaoProcesso: string;
    DescricaoPropriedade?: string;
    DescricaoParcela?: string;
    AreaPlantadaHa?: number;
}
