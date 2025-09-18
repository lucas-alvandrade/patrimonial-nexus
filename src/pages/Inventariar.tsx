import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ambiente {
  id: number;
  nome: string;
  descricao?: string;
}

export default function Inventariar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmbientes();
  }, []);

  const fetchAmbientes = async () => {
    try {
      const { data, error } = await supabase
        .from('ambientes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setAmbientes(data || []);
    } catch (error) {
      console.error('Error fetching ambientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ambientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAmbientesByBloco = (bloco: string) => {
    return ambientes.filter(ambiente => {
      const nome = ambiente.nome.toLowerCase();
      switch (bloco) {
        case 'A':
          return nome.includes('bloco a') || nome.startsWith('a-') || nome.includes(' a ');
        case 'B':
          return nome.includes('bloco b') || nome.startsWith('b-') || nome.includes(' b ');
        case 'C':
          return nome.includes('bloco c') || nome.startsWith('c-') || nome.includes(' c ');
        case 'D':
          return nome.includes('bloco d') || nome.startsWith('d-') || nome.includes(' d ');
        default:
          return !nome.includes('bloco a') && !nome.includes('bloco b') && 
                 !nome.includes('bloco c') && !nome.includes('bloco d') &&
                 !nome.startsWith('a-') && !nome.startsWith('b-') && 
                 !nome.startsWith('c-') && !nome.startsWith('d-');
      }
    });
  };

  const handleAmbienteClick = (ambiente: Ambiente) => {
    navigate(`/inventariar/${ambiente.id}`, { 
      state: { ambiente } 
    });
  };

  const renderBlocoCard = (bloco: string, ambientesBloco: Ambiente[]) => (
    <Card key={bloco} className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {bloco === 'Outros' ? 'Outros Ambientes' : `Bloco ${bloco}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ambientesBloco.length === 0 ? (
          <p className="text-muted-foreground">Nenhum ambiente encontrado neste bloco</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ambientesBloco.map((ambiente) => (
              <Button
                key={ambiente.id}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
                onClick={() => handleAmbienteClick(ambiente)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{ambiente.nome}</div>
                    {ambiente.descricao && (
                      <div className="text-sm text-muted-foreground truncate">
                        {ambiente.descricao}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ambientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inventariar</h1>
          <p className="text-muted-foreground">
            Selecione um ambiente para iniciar o inventário
          </p>
        </div>

        <div className="space-y-6">
          {['A', 'B', 'C', 'D', 'Outros'].map(bloco => 
            renderBlocoCard(bloco, getAmbientesByBloco(bloco))
          )}
        </div>
      </div>
    </div>
  );
}