import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Building2, User, Tag, Wallet, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Categoria, CentroCusto, Fornecedor, Cliente } from "@/hooks/useSupabaseData";

export interface LancamentosFilters {
  dataInicio?: Date;
  dataFim?: Date;
  status: string;
  categoria: string;
  centroCusto: string;
  fornecedorCliente: string;
  valorMin: string;
  valorMax: string;
  descricao: string;
}

interface LancamentosFilterModalProps {
  tipo: 'entrada' | 'saida';
  filters: LancamentosFilters;
  onFiltersChange: (filters: LancamentosFilters) => void;
  categorias: Categoria[];
  centrosCusto: CentroCusto[];
  fornecedores: Fornecedor[];
  clientes: Cliente[];
}

const emptyFilters: LancamentosFilters = {
  dataInicio: undefined,
  dataFim: undefined,
  status: '',
  categoria: '',
  centroCusto: '',
  fornecedorCliente: '',
  valorMin: '',
  valorMax: '',
  descricao: '',
};

export const LancamentosFilterModal = ({
  tipo,
  filters,
  onFiltersChange,
  categorias,
  centrosCusto,
  fornecedores,
  clientes
}: LancamentosFilterModalProps) => {
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<LancamentosFilters>(filters);

  const handleOpen = () => {
    setTempFilters(filters);
    setOpen(true);
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setTempFilters(emptyFilters);
  };

  const handleClearAll = () => {
    onFiltersChange(emptyFilters);
  };

  // Contagem de filtros ativos
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dataInicio' || key === 'dataFim') return value !== undefined;
    return value !== '';
  }).length;

  // Lista de filtros ativos para exibição
  const getActiveFiltersList = () => {
    const list: { label: string; value: string; icon: React.ReactNode }[] = [];
    
    if (filters.dataInicio || filters.dataFim) {
      const inicio = filters.dataInicio ? format(filters.dataInicio, "dd/MM/yyyy") : 'Início';
      const fim = filters.dataFim ? format(filters.dataFim, "dd/MM/yyyy") : 'Fim';
      list.push({ label: 'Período', value: `${inicio} → ${fim}`, icon: <Calendar className="w-3 h-3" /> });
    }
    
    if (filters.status) {
      const statusLabel = filters.status === 'pago' ? 'Pago' : filters.status === 'pendente' ? 'Pendente' : 'Cancelado';
      list.push({ label: 'Status', value: statusLabel, icon: <Tag className="w-3 h-3" /> });
    }
    
    if (filters.categoria) {
      const cat = categorias.find(c => c.id === filters.categoria);
      list.push({ label: 'Categoria', value: cat?.nome || filters.categoria, icon: <Tag className="w-3 h-3" /> });
    }
    
    if (filters.centroCusto) {
      const cc = centrosCusto.find(c => c.id === filters.centroCusto);
      list.push({ label: 'Centro Custo', value: cc?.nome || filters.centroCusto, icon: <Building2 className="w-3 h-3" /> });
    }
    
    if (filters.fornecedorCliente) {
      if (tipo === 'saida') {
        const forn = fornecedores.find(f => f.id === filters.fornecedorCliente);
        list.push({ label: 'Fornecedor', value: forn?.nome || filters.fornecedorCliente, icon: <Building2 className="w-3 h-3" /> });
      } else {
        const cli = clientes.find(c => c.id === filters.fornecedorCliente);
        list.push({ label: 'Cliente', value: cli?.nome || filters.fornecedorCliente, icon: <User className="w-3 h-3" /> });
      }
    }
    
    if (filters.valorMin || filters.valorMax) {
      const min = filters.valorMin ? `R$ ${parseFloat(filters.valorMin).toFixed(2)}` : 'R$ 0';
      const max = filters.valorMax ? `R$ ${parseFloat(filters.valorMax).toFixed(2)}` : '∞';
      list.push({ label: 'Valor', value: `${min} → ${max}`, icon: <Wallet className="w-3 h-3" /> });
    }
    
    if (filters.descricao) {
      list.push({ label: 'Descrição', value: filters.descricao, icon: <FileText className="w-3 h-3" /> });
    }
    
    return list;
  };

  const activeFiltersList = getActiveFiltersList();

  const filteredCategorias = categorias.filter(cat => cat.tipo === tipo);
  const entities = tipo === 'saida' ? fornecedores : clientes;

  return (
    <>
      {/* Botão de Filtros */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs" variant="destructive">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {/* Resumo de Filtros Ativos */}
      {activeFiltersList.length > 0 && (
        <div className="w-full mt-4 p-3 bg-muted/50 border border-border rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
              {activeFiltersList.map((filter, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
                  {filter.icon}
                  <span className="font-medium">{filter.label}:</span>
                  <span>{filter.value}</span>
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Filtros */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de {tipo === 'entrada' ? 'Entradas' : 'Saídas'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Período */}
            <div className="col-span-2">
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <CalendarIcon className="w-4 h-4" />
                Período
              </Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !tempFilters.dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempFilters.dataInicio ? format(tempFilters.dataInicio, "dd/MM/yyyy") : "Data Inicial"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={tempFilters.dataInicio}
                      onSelect={(date) => setTempFilters(prev => ({ ...prev, dataInicio: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="flex items-center text-muted-foreground">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !tempFilters.dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempFilters.dataFim ? format(tempFilters.dataFim, "dd/MM/yyyy") : "Data Final"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={tempFilters.dataFim}
                      onSelect={(date) => setTempFilters(prev => ({ ...prev, dataFim: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4" />
                Status
              </Label>
              <Select 
                value={tempFilters.status} 
                onValueChange={(value) => setTempFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4" />
                Categoria
              </Label>
              <Select 
                value={tempFilters.categoria} 
                onValueChange={(value) => setTempFilters(prev => ({ ...prev, categoria: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {filteredCategorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro de Custo */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                Centro de Custo
              </Label>
              <Select 
                value={tempFilters.centroCusto} 
                onValueChange={(value) => setTempFilters(prev => ({ ...prev, centroCusto: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {centrosCusto.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fornecedor/Cliente */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                {tipo === 'saida' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {tipo === 'saida' ? 'Fornecedor' : 'Cliente'}
              </Label>
              <Select 
                value={tempFilters.fornecedorCliente} 
                onValueChange={(value) => setTempFilters(prev => ({ ...prev, fornecedorCliente: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {entities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="col-span-2">
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4" />
                Valor
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={tempFilters.valorMin}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, valorMin: e.target.value }))}
                  className="flex-1"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="number"
                  placeholder="R$ 10.000,00"
                  value={tempFilters.valorMax}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, valorMax: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="col-span-2">
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Descrição
              </Label>
              <Input
                placeholder="Buscar por descrição..."
                value={tempFilters.descricao}
                onChange={(e) => setTempFilters(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button onClick={handleApply}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const useFilteredLancamentos = (
  lancamentos: any[],
  filters: LancamentosFilters
) => {
  let filtered = [...lancamentos];

  // Filtro por período (data de vencimento)
  if (filters.dataInicio) {
    filtered = filtered.filter(l => 
      l.data_vencimento && new Date(l.data_vencimento) >= filters.dataInicio!
    );
  }
  if (filters.dataFim) {
    filtered = filtered.filter(l => 
      l.data_vencimento && new Date(l.data_vencimento) <= filters.dataFim!
    );
  }

  // Filtro por status
  if (filters.status) {
    filtered = filtered.filter(l => l.status === filters.status);
  }

  // Filtro por categoria
  if (filters.categoria) {
    filtered = filtered.filter(l => l.categoria_id === filters.categoria);
  }

  // Filtro por centro de custo
  if (filters.centroCusto) {
    filtered = filtered.filter(l => l.centro_custo_id === filters.centroCusto);
  }

  // Filtro por fornecedor/cliente
  if (filters.fornecedorCliente) {
    filtered = filtered.filter(l => l.fornecedor_id === filters.fornecedorCliente);
  }

  // Filtro por valor mínimo
  if (filters.valorMin) {
    const min = parseFloat(filters.valorMin);
    filtered = filtered.filter(l => l.valor >= min);
  }

  // Filtro por valor máximo
  if (filters.valorMax) {
    const max = parseFloat(filters.valorMax);
    filtered = filtered.filter(l => l.valor <= max);
  }

  // Filtro por descrição
  if (filters.descricao) {
    const search = filters.descricao.toLowerCase();
    filtered = filtered.filter(l => 
      l.descricao?.toLowerCase().includes(search)
    );
  }

  return filtered;
};

export default LancamentosFilterModal;
