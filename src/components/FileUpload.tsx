import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onUploadComplete?: (results: any) => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [error, setError] = useState("");

  const pollProgress = async (processId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://bqwaasdjpxlucgsknryp.supabase.co/functions/v1/process-file-upload/status?id=${processId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxd2Fhc2RqcHhsdWNnc2tucnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTQ0NDksImV4cCI6MjA3MzI3MDQ0OX0.7edknT33F4_EOQXU3-PlbBqmt6G1TDXaDA8EkiUas6s`,
          }
        });

        if (response.ok) {
          const status = await response.json();
          setProcessingStatus(status);
          
          // Calculate progress percentage
          const progressPercent = Math.round((status.processed / status.total) * 100);
          setUploadProgress(progressPercent);

          if (status.status === 'completed' || status.status === 'error') {
            clearInterval(interval);
            setIsUploading(false);
            
            if (status.status === 'completed') {
              setUploadResults({
                total: status.total,
                successful: status.successful,
                errors: status.errors,
                duplicates: status.duplicates
              });
              onUploadComplete?.({
                total: status.total,
                successful: status.successful,
                errors: status.errors,
                duplicates: status.duplicates
              });
            } else {
              setError('Erro durante o processamento dos dados.');
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 1000); // Poll every second

    return interval;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xlsx') {
        setSelectedFile(file);
        setError("");
        setUploadResults(null);
        setProcessingStatus(null);
        setUploadProgress(0);
      } else {
        setError("Apenas arquivos CSV e XLSX são suportados");
        setSelectedFile(null);
      }
    }
  };

  const processFile = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return await file.text();
    } else if (fileExtension === 'xlsx') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return JSON.stringify(jsonData);
    }
    
    throw new Error('Tipo de arquivo não suportado');
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadType) {
      setError("Selecione um arquivo e tipo de upload");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Step 1: Processing file (20% progress)
      setUploadProgress(20);
      const fileContent = await processFile(selectedFile);
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();

      // Step 2: Uploading to server (40% progress)
      setUploadProgress(40);
      const { data, error } = await supabase.functions.invoke('process-file-upload', {
        body: {
          fileContent,
          fileType,
          uploadType
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.processId) {
        setProcessId(data.processId);
        // Start polling for progress
        pollProgress(data.processId);
      } else {
        throw new Error(data?.error || 'Erro durante o processamento');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erro durante o upload');
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadType("");
    setUploadResults(null);
    setError("");
    setUploadProgress(0);
    setProcessId(null);
    setProcessingStatus(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Arquivos
        </CardTitle>
        <CardDescription>
          Importe dados de ambientes ou bens através de arquivos CSV ou XLSX
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!uploadResults ? (
          <>
            <div className="space-y-2">
              <Label>Tipo de Importação</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de dados a importar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambientes">Ambientes</SelectItem>
                  <SelectItem value="bens">Bens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      {selectedFile ? (
                        <span className="font-medium text-foreground">
                          {selectedFile.name}
                        </span>
                      ) : (
                        "Clique para selecionar um arquivo CSV ou XLSX"
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {uploadType === 'ambientes' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato esperado para Ambientes:</strong><br />
                  Colunas: nome, bloco, descricao<br />
                  Exemplo: "A 107", "A", "Sala de reuniões do bloco A"
                </AlertDescription>
              </Alert>
            )}

            {uploadType === 'bens' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato esperado para Bens:</strong><br />
                  Colunas: numero_patrimonio, descricao, valor<br />
                  Exemplo: "PAT001", "Mesa de escritório", "500.00"<br />
                  <strong>Nota:</strong> Números duplicados serão ignorados automaticamente.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isUploading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progresso do Processamento</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                
                {processingStatus && (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="font-medium text-foreground">{processingStatus.processed}</div>
                      <div className="text-muted-foreground">Processados</div>
                    </div>
                    <div>
                      <div className="font-medium text-success">{processingStatus.successful}</div>
                      <div className="text-muted-foreground">Sucessos</div>
                    </div>
                    <div>
                      <div className="font-medium text-destructive">{processingStatus.errors}</div>
                      <div className="text-muted-foreground">Erros</div>
                    </div>
                    <div>
                      <div className="font-medium text-warning">{processingStatus.duplicates}</div>
                      <div className="text-muted-foreground">Duplicados</div>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground text-center">
                  {uploadProgress <= 40 && "Enviando arquivo..."}
                  {uploadProgress > 40 && uploadProgress < 100 && processingStatus && `Processando registros (${processingStatus.processed}/${processingStatus.total})`}
                  {uploadProgress === 100 && "Processamento concluído!"}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !uploadType || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Fazer Upload
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Upload Concluído</span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{uploadResults.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{uploadResults.successful}</div>
                <div className="text-sm text-muted-foreground">Sucessos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{uploadResults.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{uploadResults.duplicates || 0}</div>
                <div className="text-sm text-muted-foreground">Duplicados</div>
              </div>
            </div>

            <Progress 
              value={(uploadResults.successful / uploadResults.total) * 100} 
              className="w-full"
            />

            {uploadResults.errors > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  {uploadResults.errors} registros não puderam ser importados. 
                  {uploadResults.duplicates > 0 && ` ${uploadResults.duplicates} eram duplicados e foram ignorados.`}
                  Verifique se os dados estão no formato correto.
                </AlertDescription>
              </Alert>
            )}

            {uploadResults.duplicates > 0 && uploadResults.errors === uploadResults.duplicates && (
              <Alert>
                <AlertDescription>
                  {uploadResults.duplicates} registros duplicados foram ignorados para evitar conflitos.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={resetUpload} variant="outline" className="flex-1">
                Novo Upload
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;