-- ==========================================
-- SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- Ejecutar este script en el editor SQL de Supabase (SQL Editor)
-- ==========================================

-- 1. Crear la tabla de productos
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  category text not null,
  image_url text,
  stock integer default 10 not null,
  position integer default 0 not null,
  is_new_model boolean default false not null
);

-- 2. Habilitar la seguridad a nivel de fila (Row Level Security - RLS)
alter table public.products enable row level security;

-- 3. Crear políticas de acceso para la tabla de productos
drop policy if exists "Permitir lectura pública de productos" on public.products;
create policy "Permitir lectura pública de productos"
  on public.products for select
  using (true);

drop policy if exists "Permitir escritura/edición solo a administradores autenticados" on public.products;
create policy "Permitir escritura/edición solo a administradores autenticados"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 4. Crear el bucket de almacenamiento para imágenes de productos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 5. Crear políticas de acceso para el bucket de almacenamiento de imágenes
drop policy if exists "Permitir lectura pública de imágenes" on storage.objects;
create policy "Permitir lectura pública de imágenes"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Permitir subida y edición de imágenes a admin autenticado" on storage.objects;
create policy "Permitir subida y edición de imágenes a admin autenticado"
  on storage.objects for all
  using (bucket_id = 'product-images' and auth.role() = 'authenticated')
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ==========================================
-- DATOS SEMILLA (PRODUCTOS DE EJEMPLO)
-- Opcional: ejecuta esto si deseas tener productos iniciales
-- ==========================================
insert into public.products (name, description, price, category, image_url, stock, position)
values 
('Cuadro de Promoción Clásico Madera', 'Elegante cuadro de madera tallada con molduras doradas, ideal para fotos grupales de promoción escolar y universitaria. Medidas standard.', 150.00, 'Clásico', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600', 50, 1),
('Cuadro Moderno Vidrio Dúplex', 'Estructura minimalista de doble vidrio templado suspendido con pernos de acero inoxidable. Aporta ligereza y elegancia a la foto de graduación.', 220.00, 'Moderno', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600', 30, 2),
('Placa de Graduación Tallada Metálica', 'Placa de aluminio o bronce montada sobre una base de madera noble, con grabados en bajorrelieve y nombres de toda la promoción.', 280.00, 'Placas', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600', 20, 3),
('Cuadro de Promoción Flotante Premium', 'Cuadro con marco interno oculto que da la sensación de flotar en la pared. Acabado brillante con protección UV para la fotografía.', 180.00, 'Premium', 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=600', 40, 4),
('Portafoto Individual Cuero y Oro', 'Elegante portafoto individual de graduación forrado en ecocuero azul marino con grabados dorados de la promoción.', 85.00, 'Accesorios', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600', 100, 5);
