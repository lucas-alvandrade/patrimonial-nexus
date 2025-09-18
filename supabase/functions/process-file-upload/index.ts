import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  [key: string]: string;
}

interface ProcessingStatus {
  id: string;
  total: number;
  processed: number;
  successful: number;
  errors: number;
  status: 'processing' | 'completed' | 'error';
  duplicates: number;
}

// In-memory storage for processing status
const processingStatus = new Map<string, ProcessingStatus>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Handle status check requests
  if (url.pathname === '/status' && req.method === 'GET') {
    const processId = url.searchParams.get('id');
    if (!processId || !processingStatus.has(processId)) {
      return new Response(
        JSON.stringify({ error: 'Process not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const status = processingStatus.get(processId)!;
    return new Response(
      JSON.stringify(status),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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

    // Generate unique process ID
    const processId = crypto.randomUUID();

    // Initialize processing status
    processingStatus.set(processId, {
      id: processId,
      total: data.length,
      processed: 0,
      successful: 0,
      errors: 0,
      duplicates: 0,
      status: 'processing'
    });

    // For any size file, process in background to allow real-time progress
    EdgeRuntime.waitUntil(processFileWithProgress(supabase, data, uploadType, processId));
    
    // Return immediate response with process ID
    return new Response(
      JSON.stringify({
        success: true,
        message: 'File processing started',
        processId: processId,
        results: {
          total: data.length,
          status: 'processing',
          message: 'Processing started. You can track progress in real-time.'
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

async function processBensWithProgress(supabase: any, data: CSVRow[], processId: string) {
  const status = processingStatus.get(processId)!;
  const BATCH_SIZE = 100; // Process in batches of 100
  
  console.log(`Processing ${data.length} records in batches of ${BATCH_SIZE}`);
  
  // First, get existing patrimônio numbers to check for duplicates
  const { data: existingBens, error: fetchError } = await supabase
    .from('bens')
    .select('numero_patrimonio');
  
  if (fetchError) {
    console.error('Error fetching existing bens:', fetchError);
  }
  
  const existingNumbers = new Set(existingBens?.map(bem => bem.numero_patrimonio) || []);
  console.log(`Found ${existingNumbers.size} existing patrimônio numbers`);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
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
          valor: parseFloat(row.VALOR || row.valor || row.Valor || row.value || '0') || 0,
          condicao: 'bom' // Default condition
        };

        if (!bem.numero_patrimonio) {
          status.errors++;
          status.processed++;
          continue;
        }

        // Check for duplicates
        if (existingNumbers.has(bem.numero_patrimonio)) {
          status.duplicates++;
          status.errors++;
          status.processed++;
          continue;
        }

        bensToInsert.push(bem);
        existingNumbers.add(bem.numero_patrimonio); // Add to set to prevent duplicates within the same batch
      } catch (error) {
        status.errors++;
        status.processed++;
      }
    }
    
    // Bulk insert for this batch
    if (bensToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from('bens')
          .insert(bensToInsert);

        if (error) {
          // If bulk insert fails, try individual inserts for this batch
          console.log(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);
          for (const bem of bensToInsert) {
            try {
              const { error: individualError } = await supabase
                .from('bens')
                .insert(bem);
              
              if (individualError) {
                status.errors++;
              } else {
                status.successful++;
              }
              status.processed++;
            } catch (individualError) {
              status.errors++;
              status.processed++;
            }
          }
        } else {
          // Bulk insert succeeded
          status.successful += bensToInsert.length;
          status.processed += bensToInsert.length;
        }
      } catch (error) {
        // Fallback to individual inserts
        for (const bem of bensToInsert) {
          try {
            const { error: individualError } = await supabase
              .from('bens')
              .insert(bem);
            
            if (individualError) {
              status.errors++;
            } else {
              status.successful++;
            }
            status.processed++;
          } catch (individualError) {
            status.errors++;
            status.processed++;
          }
        }
      }
    } else {
      // Update processed count for skipped items in this batch
      status.processed += batch.length - bensToInsert.length;
    }
    
    // Update status
    processingStatus.set(processId, status);
    
    // Log progress
    console.log(`Progress: ${status.processed}/${status.total} processed, ${status.successful} successful, ${status.errors} errors, ${status.duplicates} duplicates`);
    
    // Add small delay to prevent overwhelming the database
    if (i + BATCH_SIZE < data.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Mark as completed
  status.status = 'completed';
  processingStatus.set(processId, status);
  
  return status;
}

// Background processing function with real-time progress
async function processFileWithProgress(supabase: any, data: CSVRow[], uploadType: string, processId: string) {
  try {
    console.log(`Starting processing of ${data.length} records for ${uploadType} with process ID ${processId}`);
    
    if (uploadType === 'ambientes') {
      await processAmbientesWithProgress(supabase, data, processId);
    } else if (uploadType === 'bens') {
      await processBensWithProgress(supabase, data, processId);
    } else {
      const status = processingStatus.get(processId)!;
      status.status = 'error';
      processingStatus.set(processId, status);
      throw new Error('Unsupported upload type');
    }

    console.log(`Processing complete for process ID ${processId}`);
    
    // Keep status for 10 minutes after completion
    setTimeout(() => {
      processingStatus.delete(processId);
    }, 10 * 60 * 1000);
    
  } catch (error) {
    console.error('Processing error:', error);
    const status = processingStatus.get(processId);
    if (status) {
      status.status = 'error';
      processingStatus.set(processId, status);
    }
  }
}

async function processAmbientesWithProgress(supabase: any, data: CSVRow[], processId: string) {
  const status = processingStatus.get(processId)!;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const ambiente = {
        nome: row.nome || row.Nome || row.name || '',
        bloco: row.bloco || row.Bloco || row.block || '',
        descricao: row.descricao || row.Descrição || row.description || row.desc || ''
      };

      if (!ambiente.nome) {
        status.errors++;
        status.processed++;
        continue;
      }

      const { error } = await supabase
        .from('ambientes')
        .insert(ambiente);

      if (error) {
        status.errors++;
      } else {
        status.successful++;
      }
      status.processed++;

    } catch (error) {
      status.errors++;
      status.processed++;
    }

    // Update status every 10 records
    if (i % 10 === 0) {
      processingStatus.set(processId, status);
      console.log(`Ambientes progress: ${status.processed}/${status.total} processed`);
    }
  }

  // Mark as completed
  status.status = 'completed';
  processingStatus.set(processId, status);
  
  return status;
}

// Handle function shutdown
addEventListener('beforeunload', (ev) => {
  console.log('Function shutdown due to:', ev.detail?.reason);
});