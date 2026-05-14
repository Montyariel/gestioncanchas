-- Vaciamos el stock existente (opcional, comentar si se quiere mantener el stock anterior)
DELETE FROM stock;

-- Insertamos el nuevo catálogo para ambas sucursales
-- Se asumen precios en ARS según el listado proporcionado.

-- LANÚS
INSERT INTO stock (sucursal, item, cantidad, precio_venta, categoria) VALUES 
('lanus', 'Hamburguesa Simple', 50, 750, 'Hamburguesas'),
('lanus', 'Hamburguesa Completa Champion', 50, 1500, 'Hamburguesas'),
('lanus', 'Hamburguesa Clásica Doble', 50, 1200, 'Hamburguesas'),
('lanus', 'Hamburguesa Vegetariana Green Power', 50, 1100, 'Hamburguesas'),

('lanus', 'Pancho Simple', 50, 580, 'Panchos'),
('lanus', 'Pancho Completo Ejecutivo', 50, 1100, 'Panchos'),
('lanus', 'Pancho Criollo Argentino', 50, 950, 'Panchos'),
('lanus', 'Pancho Vegetariano Natura', 50, 850, 'Panchos'),

('lanus', 'Picada Clásica Reunión', 20, 2200, 'Picadas'),
('lanus', 'Picada Gourmet Premium', 10, 3200, 'Picadas'),
('lanus', 'Picada Vegetariana Verde', 20, 1800, 'Picadas'),
('lanus', 'Picada Cordobesa Tradicional', 15, 2600, 'Picadas'),
('lanus', 'Picada Para Equipos XXL', 10, 7800, 'Picadas'),

('lanus', 'Agua Natural', 100, 170, 'Bebidas'),
('lanus', 'Agua Mineral Perrier', 50, 420, 'Bebidas'),
('lanus', 'Agua Mineral San Pellegrino', 50, 480, 'Bebidas'),

('lanus', 'Jugo Natural Naranja', 40, 600, 'Bebidas'),
('lanus', 'Jugo Vitaminado Naranja+Zanahoria', 40, 700, 'Bebidas'),
('lanus', 'Licuado Power Athlete', 40, 750, 'Bebidas'),
('lanus', 'Licuado Proteína Chocolate', 40, 1050, 'Bebidas'),

('lanus', 'Coca-Cola', 100, 350, 'Bebidas'),
('lanus', 'Sprite', 100, 300, 'Bebidas'),
('lanus', 'Gatorade', 100, 420, 'Bebidas'),
('lanus', 'Red Bull', 50, 600, 'Bebidas'),

('lanus', 'Cerveza Lata Quilmes', 60, 600, 'Cervezas'),
('lanus', 'Cerveza Botella Brahma', 60, 550, 'Cervezas'),
('lanus', 'Cerveza Botella Heineken', 40, 950, 'Cervezas');


-- BELGRANO
INSERT INTO stock (sucursal, item, cantidad, precio_venta, categoria) VALUES 
('belgrano', 'Hamburguesa Simple', 50, 750, 'Hamburguesas'),
('belgrano', 'Hamburguesa Completa Champion', 50, 1500, 'Hamburguesas'),
('belgrano', 'Hamburguesa Clásica Doble', 50, 1200, 'Hamburguesas'),
('belgrano', 'Hamburguesa Vegetariana Green Power', 50, 1100, 'Hamburguesas'),

('belgrano', 'Pancho Simple', 50, 580, 'Panchos'),
('belgrano', 'Pancho Completo Ejecutivo', 50, 1100, 'Panchos'),
('belgrano', 'Pancho Criollo Argentino', 50, 950, 'Panchos'),
('belgrano', 'Pancho Vegetariano Natura', 50, 850, 'Panchos'),

('belgrano', 'Picada Clásica Reunión', 20, 2200, 'Picadas'),
('belgrano', 'Picada Gourmet Premium', 10, 3200, 'Picadas'),
('belgrano', 'Picada Vegetariana Verde', 20, 1800, 'Picadas'),
('belgrano', 'Picada Cordobesa Tradicional', 15, 2600, 'Picadas'),
('belgrano', 'Picada Para Equipos XXL', 10, 7800, 'Picadas'),

('belgrano', 'Agua Natural', 100, 170, 'Bebidas'),
('belgrano', 'Agua Mineral Perrier', 50, 420, 'Bebidas'),
('belgrano', 'Agua Mineral San Pellegrino', 50, 480, 'Bebidas'),

('belgrano', 'Jugo Natural Naranja', 40, 600, 'Bebidas'),
('belgrano', 'Jugo Vitaminado Naranja+Zanahoria', 40, 700, 'Bebidas'),
('belgrano', 'Licuado Power Athlete', 40, 750, 'Bebidas'),
('belgrano', 'Licuado Proteína Chocolate', 40, 1050, 'Bebidas'),

('belgrano', 'Coca-Cola', 100, 350, 'Bebidas'),
('belgrano', 'Sprite', 100, 300, 'Bebidas'),
('belgrano', 'Gatorade', 100, 420, 'Bebidas'),
('belgrano', 'Red Bull', 50, 600, 'Bebidas'),

('belgrano', 'Cerveza Lata Quilmes', 60, 600, 'Cervezas'),
('belgrano', 'Cerveza Botella Brahma', 60, 550, 'Cervezas'),
('belgrano', 'Cerveza Botella Heineken', 40, 950, 'Cervezas');
