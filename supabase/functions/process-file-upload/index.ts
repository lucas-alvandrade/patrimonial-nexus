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

    // For large files, process in background
    if (data.length > 1000) {
      // Start background processing
      EdgeRuntime.waitUntil(processLargeFile(supabase, data, uploadType));
      
      // Return immediate response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'File processing started in background',
          results: {
            total: data.length,
            status: 'processing',
            message: 'Large file is being processed. Please check back in a few minutes.'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Process small files immediately
      let insertResults;
      
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
            details: insertResults.slice(0, 10) // Only return first 10 for large datasets
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
  const BATCH_SIZE = 100; // Process in batches of 100
  
  console.log(`Processing ${data.length} records in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchResults = [];
    
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)}`);
    
    // Prepare batch data
    const bensToInsert = [];
    
    for (const row of batch) {
      try {
        const bem = {
          numero_patrimonio: row.NUMERO || row.numero || row.Numero || row.numero_patrimonio || row.patrimonio || row.number || '',
          descricao: row.DESCRICAO || row.descricao || row.Descricao || row.description || row.desc || '',
          carga_atual: row['CARGA ATUAL'] || row.carga_atual || row['Carga Atual'] || row.carga || row.cargo || '',
          setor_responsavel: row['SETOR DO RESPONSÁVEL'] || row['SETOR RESPONSÁVEL'] || row.setor_responsavel || row['Setor Responsável'] || row.setor || row.responsavel || '',
          valor: parseFloat(row.VALOR || row.valor || row.Valor || row.value || '0') || 0
        };

        if (!bem.numero_patrimonio) {
          batchResults.push({
            success: false,
            error: 'Número do patrimônio é obrigatório',
            row: row
          });
          continue;
        }

        bensToInsert.push(bem);
      } catch (error) {
        batchResults.push({
          success: false,
          error: error.message,
          row: row
        });
      }
    }
    
    // Bulk insert for this batch
    if (bensToInsert.length > 0) {
      try {
        const { data: insertedData, error } = await supabase
          .from('bens')
          .insert(bensToInsert);

        if (error) {
          // If bulk insert fails, try individual inserts for this batch
          console.log(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);
          for (let j = 0; j < bensToInsert.length; j++) {
            try {
              const { error: individualError } = await supabase
                .from('bens')
                .insert(bensToInsert[j]);
              
              if (individualError) {
                batchResults.push({
                  success: false,
                  error: individualError.message,
                  row: batch[batchResults.length + j]
                });
              } else {
                batchResults.push({
                  success: true,
                  row: batch[batchResults.length + j]
                });
              }
            } catch (individualError) {
              batchResults.push({
                success: false,
                error: individualError.message,
                row: batch[batchResults.length + j]
              });
            }
          }
        } else {
          // Bulk insert succeeded
          for (let j = 0; j < bensToInsert.length; j++) {
            batchResults.push({
              success: true,
              row: batch[batchResults.length + j]
            });
          }
        }
      } catch (error) {
        // Fallback to individual inserts
        for (let j = 0; j < bensToInsert.length; j++) {
          try {
            const { error: individualError } = await supabase
              .from('bens')
              .insert(bensToInsert[j]);
            
            batchResults.push({
              success: !individualError,
              error: individualError?.message,
              row: batch[batchResults.length + j]
            });
          } catch (individualError) {
            batchResults.push({
              success: false,
              error: individualError.message,
              row: batch[batchResults.length + j]
            });
          }
        }
      }
    }
    
    results.push(...batchResults);
    
    // Log progress
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    console.log(`Progress: ${results.length}/${data.length} processed, ${successCount} successful, ${errorCount} errors`);
  }

  return results;
}

// Background processing function for large files
async function processLargeFile(supabase: any, data: CSVRow[], uploadType: string) {
  try {
    console.log(`Starting background processing of ${data.length} records for ${uploadType}`);
    
    let insertResults;
    
    if (uploadType === 'ambientes') {
      insertResults = await processAmbientes(supabase, data);
    } else if (uploadType === 'bens') {
      insertResults = await processBens(supabase, data);
    } else {
      throw new Error('Unsupported upload type');
    }

    const successCount = insertResults.filter(r => r.success).length;
    const errorCount = insertResults.filter(r => !r.success).length;

    console.log(`Background processing complete: ${successCount} successful, ${errorCount} errors`);
    
  } catch (error) {
    console.error('Background processing error:', error);
  }
}

// Handle function shutdown
addEventListener('beforeunload', (ev) => {
  console.log('Function shutdown due to:', ev.detail?.reason);
});