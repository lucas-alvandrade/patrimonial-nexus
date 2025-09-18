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
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xlsx') {
        setSelectedFile(file);
        setError("");
        setUploadResults(null);
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

      // Step 2: Uploading to server (60% progress)
      setUploadProgress(60);
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

      // Step 3: Processing complete (100% progress)
      setUploadProgress(100);

      if (data?.success) {
        setUploadResults(data.results);
        onUploadComplete?.(data.results);
      } else {
        throw new Error(data?.error || 'Erro durante o processamento');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erro durante o upload');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadType("");
    setUploadResults(null);
    setError("");
    setUploadProgress(0);
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
                  Colunas: numero_patrimonio, descricao, condicao<br />
                  Exemplo: "PAT001", "Mesa de escritório", "bom"<br />
                  Condição deve ser: "bom" ou "inservível"
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso do Upload</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {uploadProgress <= 20 && "Processando arquivo..."}
                  {uploadProgress > 20 && uploadProgress <= 60 && "Enviando dados..."}
                  {uploadProgress > 60 && uploadProgress < 100 && "Salvando registros..."}
                  {uploadProgress === 100 && "Concluído!"}
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

            <div className="grid grid-cols-3 gap-4 text-center">
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
            </div>

            <Progress 
              value={(uploadResults.successful / uploadResults.total) * 100} 
              className="w-full"
            />

            {uploadResults.errors > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  {uploadResults.errors} registros não puderam ser importados. 
                  Verifique se os dados estão no formato correto.
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