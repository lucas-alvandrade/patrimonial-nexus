import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  [key: string]: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileType, uploadType } = await req.json();

    if (!fileContent || !fileType || !uploadType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing ${fileType} file for ${uploadType}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let data: CSVRow[];

    // Parse file based on type
    if (fileType === 'csv') {
      data = parseCSV(fileContent);
    } else if (fileType === 'xlsx') {
      // For XLSX, the content should already be processed on the client
      data = JSON.parse(fileContent);
    } else {
      throw new Error('Unsupported file type');
    }

    console.log(`Parsed ${data.length} rows from file`);

    let insertResults;
    let errors: string[] = [];

    // Process data based on upload type
    if (uploadType === 'ambientes') {
      insertResults = await processAmbientes(supabase, data);
    } else if (uploadType === 'bens') {
      insertResults = await processBens(supabase, data);
    } else {
      throw new Error('Unsupported upload type');
    }

    const successCount = insertResults.filter(r => r.success).length;
    const errorCount = insertResults.filter(r => !r.success).length;

    console.log(`Processing complete: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          total: data.length,
          successful: successCount,
          errors: errorCount,
          details: insertResults
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('File processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }

  return rows;
}

async function processAmbientes(supabase: any, data: CSVRow[]) {
  const results = [];

  for (const row of data) {
    try {
      const ambiente = {
        nome: row.nome || row.Nome || row.name || '',
        bloco: row.bloco || row.Bloco || row.block || '',
        descricao: row.descricao || row.Descrição || row.description || row.desc || ''
      };

      if (!ambiente.nome) {
        results.push({
          success: false,
          error: 'Nome do ambiente é obrigatório',
          row: row
        });
        continue;
      }

      const { error } = await supabase
        .from('ambientes')
        .insert(ambiente);

      if (error) {
        results.push({
          success: false,
          error: error.message,
          row: row
        });
      } else {
        results.push({
          success: true,
          row: row
        });
      }
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        row: row
      });
    }
  }

  return results;
}

async function processBens(supabase: any, data: CSVRow[]) {
  const results = [];

  for (const row of data) {
    try {
      const bem = {
        numero_patrimonio: row.NUMERO || row.numero || row.Numero || row.numero_patrimonio || row.patrimonio || row.number || '',
        descricao: row.DESCRICAO || row.descricao || row.Descricao || row.description || row.desc || '',
        carga_atual: row['CARGA ATUAL'] || row.carga_atual || row['Carga Atual'] || row.carga || row.cargo || '',
        setor_responsavel: row['SETOR DO RESPONSÁVEL'] || row['SETOR RESPONSÁVEL'] || row.setor_responsavel || row['Setor Responsável'] || row.setor || row.responsavel || '',
        valor: parseFloat(row.VALOR || row.valor || row.Valor || row.value || '0') || 0
      };

      if (!bem.numero_patrimonio) {
        results.push({
          success: false,
          error: 'Número do patrimônio é obrigatório',
          row: row
        });
        continue;
      }

      const { error } = await supabase
        .from('bens')
        .insert(bem);

      if (error) {
        results.push({
          success: false,
          error: error.message,
          row: row
        });
      } else {
        results.push({
          success: true,
          row: row
        });
      }
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        row: row
      });
    }
  }

  return results;
}