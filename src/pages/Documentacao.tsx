import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  ScanBarcode, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  Search, 
  PenLine,
  ListChecks,
  MapPin,
  Package
} from "lucide-react";

export default function Documentacao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Documentação
        </h1>
        <p className="text-muted-foreground mt-2">
          Guias e tutoriais para utilização do sistema SIIF
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Como Inventariar um Ambiente
          </CardTitle>
          <CardDescription>
            Tutorial completo para realizar o inventário de bens patrimoniais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              {/* Introdução */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Introdução
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  O inventário patrimonial é o processo de identificação, registro e verificação de todos os 
                  bens localizados em um determinado ambiente. Este tutorial irá guiá-lo através de todas 
                  as etapas necessárias para realizar um inventário completo e preciso.
                </p>
              </section>

              {/* Acessando o Ambiente */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  1. Acessando o Ambiente para Inventário
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>No menu lateral, clique em <Badge variant="secondary">Inventariar</Badge></li>
                    <li>Localize o ambiente desejado na lista (use a busca ou filtros se necessário)</li>
                    <li>Clique no botão <Badge variant="outline">Inventariar</Badge> ao lado do ambiente</li>
                    <li>O sistema abrirá a tela de inventário do ambiente selecionado</li>
                  </ol>
                </div>
              </section>

              {/* Status do Inventário */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                  2. Entendendo os Status do Inventário
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Badge variant="secondary" className="mt-0.5">Não Iniciado</Badge>
                    <p className="text-sm text-muted-foreground">
                      O ambiente ainda não teve nenhum item registrado. O inventário começa automaticamente 
                      ao cadastrar o primeiro bem.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                    <Badge className="bg-warning text-warning-foreground mt-0.5">Em Andamento</Badge>
                    <p className="text-sm text-muted-foreground">
                      O inventário foi iniciado e está em processo. Bens podem ser adicionados ou removidos.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                    <Badge className="bg-success text-success-foreground mt-0.5">Concluído</Badge>
                    <p className="text-sm text-muted-foreground">
                      O inventário foi finalizado. Nenhum novo item pode ser adicionado após a conclusão.
                    </p>
                  </div>
                </div>
              </section>

              {/* Métodos de Cadastro */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-muted-foreground" />
                  3. Métodos de Cadastro de Bens
                </h3>
                
                <Accordion type="single" collapsible className="w-full">
                  {/* Método Manual */}
                  <AccordionItem value="manual">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        <span>Cadastro Manual (Digitação)</span>
                        <Badge variant="outline" className="ml-2">Tipo M</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>Digite o número do patrimônio no campo "Patrimônio"</li>
                          <li>Clique no botão <Badge variant="secondary">Buscar</Badge></li>
                          <li>Se encontrado, os dados do bem serão preenchidos automaticamente</li>
                          <li>Selecione a situação do bem (Bom, Regular, Ruim, Inservível)</li>
                          <li>Clique em <Badge>Salvar Item</Badge></li>
                        </ol>
                        <div className="bg-primary/10 p-3 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            <strong>Observação:</strong> Se o patrimônio não for encontrado na base, você pode 
                            cadastrá-lo manualmente preenchendo a descrição.
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Método Código de Barras */}
                  <AccordionItem value="barcode">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <ScanBarcode className="h-4 w-4 text-primary" />
                        <span>Leitura de Código de Barras</span>
                        <Badge variant="outline" className="ml-2">Tipo A</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>Clique no botão <Badge variant="secondary"><ScanBarcode className="h-3 w-3 inline mr-1" />Ler Código de Barras</Badge></li>
                          <li>Permita o acesso à câmera quando solicitado</li>
                          <li>Aponte a câmera para o código de barras do bem</li>
                          <li>Ao detectar o código, um sinal sonoro confirmará a leitura</li>
                          <li>O número será automaticamente inserido e, se encontrado na base, o item será salvo automaticamente</li>
                        </ol>
                        
                        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Formatos de código suportados:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">EAN-13</Badge>
                            <Badge variant="outline">EAN-8</Badge>
                            <Badge variant="outline">UPC-A</Badge>
                            <Badge variant="outline">UPC-E</Badge>
                            <Badge variant="outline">ITF / DUN-14</Badge>
                            <Badge variant="outline">Code 128</Badge>
                          </div>
                        </div>

                        <div className="bg-warning/10 p-3 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            <strong>Dica:</strong> Para melhor leitura, mantenha o código de barras limpo e 
                            bem iluminado. Evite reflexos e mantenha a câmera estável.
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>

              {/* Situação dos Bens */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  4. Classificação da Situação dos Bens
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 p-2 border rounded-lg">
                    <Badge className="bg-success text-success-foreground w-24 justify-center">Bom</Badge>
                    <p className="text-sm text-muted-foreground">Bem em perfeito estado de conservação e funcionamento</p>
                  </div>
                  <div className="flex items-center gap-3 p-2 border rounded-lg">
                    <Badge className="bg-primary text-primary-foreground w-24 justify-center">Regular</Badge>
                    <p className="text-sm text-muted-foreground">Bem com pequenos desgastes mas ainda funcional</p>
                  </div>
                  <div className="flex items-center gap-3 p-2 border rounded-lg">
                    <Badge className="bg-warning text-warning-foreground w-24 justify-center">Ruim</Badge>
                    <p className="text-sm text-muted-foreground">Bem com danos significativos que afetam seu uso</p>
                  </div>
                  <div className="flex items-center gap-3 p-2 border rounded-lg">
                    <Badge className="bg-destructive text-destructive-foreground w-24 justify-center">Inservível</Badge>
                    <p className="text-sm text-muted-foreground">Bem sem condições de uso, necessita descarte</p>
                  </div>
                </div>
              </section>

              {/* Itens Duplicados */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  5. Tratamento de Itens Duplicados
                </h3>
                <div className="bg-warning/10 p-4 rounded-lg space-y-3">
                  <p className="text-muted-foreground">
                    Se você tentar cadastrar um patrimônio que já foi registrado neste inventário:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>O sistema exibirá um alerta de duplicidade</li>
                    <li>O item será marcado com a indicação <Badge variant="destructive">DUPLICADO</Badge></li>
                    <li>Você pode optar por manter ou remover o registro duplicado</li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic">
                    Itens duplicados são sinalizados nos relatórios para verificação posterior.
                  </p>
                </div>
              </section>

              {/* Gerenciando Itens */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                  6. Gerenciando Itens Cadastrados
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="font-medium">Ações disponíveis para cada item:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">Editar</Badge>
                      <span>Alterar a situação ou descrição do bem (apenas em inventários não concluídos)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="destructive" className="mt-0.5">Excluir</Badge>
                      <span>Remover o item do inventário (apenas em inventários não concluídos)</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic">
                    Os itens são ordenados do mais recente para o mais antigo, facilitando a visualização 
                    dos últimos registros.
                  </p>
                </div>
              </section>

              {/* Concluindo o Inventário */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  7. Concluindo o Inventário
                </h3>
                <div className="bg-success/10 p-4 rounded-lg space-y-3">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Verifique se todos os bens do ambiente foram registrados</li>
                    <li>Confirme se as situações estão corretamente classificadas</li>
                    <li>Clique no botão <Badge className="bg-success">Concluir Inventário</Badge></li>
                    <li>Confirme a ação no diálogo que será exibido</li>
                  </ol>
                  <div className="bg-destructive/10 p-3 rounded-lg flex items-start gap-2 mt-3">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <strong>Atenção:</strong> Após concluir o inventário, não será possível adicionar, 
                      editar ou remover itens. Certifique-se de que todos os dados estão corretos antes 
                      de finalizar.
                    </p>
                  </div>
                </div>
              </section>

              {/* Dicas Importantes */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  8. Dicas Importantes
                </h3>
                <div className="grid gap-3">
                  <div className="p-3 border border-primary/30 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground">
                      <strong>💡 Modo Offline:</strong> O sistema suporta funcionamento offline. Os dados 
                      serão sincronizados automaticamente quando a conexão for restabelecida.
                    </p>
                  </div>
                  <div className="p-3 border border-primary/30 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground">
                      <strong>💡 Identificação do Inventariante:</strong> O sistema registra automaticamente 
                      o usuário responsável por cada item cadastrado.
                    </p>
                  </div>
                  <div className="p-3 border border-primary/30 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground">
                      <strong>💡 Tipo de Cadastro:</strong> O sistema diferencia itens cadastrados 
                      automaticamente via código de barras (A) dos cadastrados manualmente (M) nos relatórios.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
