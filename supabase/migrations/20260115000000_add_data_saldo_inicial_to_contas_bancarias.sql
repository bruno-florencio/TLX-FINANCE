ALTER TABLE public.contas RENAME TO contas_bancarias;

ALTER TABLE public.contas_bancarias ADD COLUMN data_saldo_inicial DATE;
