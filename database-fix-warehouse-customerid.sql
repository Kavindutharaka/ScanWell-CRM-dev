-- SQL Script to fix WarehouseQuotes CustomerId foreign key constraint
-- This makes CustomerId nullable and allows warehouse quotes without a customer

-- Step 1: Drop the existing foreign key constraint
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK__Warehouse__Custo__5EAA0504')
BEGIN
    ALTER TABLE WarehouseQuotes
    DROP CONSTRAINT FK__Warehouse__Custo__5EAA0504;
    PRINT 'Dropped existing foreign key constraint';
END
GO

-- Step 2: Make CustomerId column nullable (if it's not already)
-- First check if column needs to be modified
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'WarehouseQuotes'
    AND COLUMN_NAME = 'CustomerId'
    AND IS_NULLABLE = 'NO'
)
BEGIN
    -- Modify the column to allow NULL
    ALTER TABLE WarehouseQuotes
    ALTER COLUMN CustomerId INT NULL;
    PRINT 'Modified CustomerId column to allow NULL';
END
ELSE
BEGIN
    PRINT 'CustomerId column already allows NULL';
END
GO

-- Step 3: Recreate the foreign key constraint that allows NULL values
ALTER TABLE WarehouseQuotes
ADD CONSTRAINT FK_WarehouseQuotes_Customer
FOREIGN KEY (CustomerId) REFERENCES account_reg(SysID);
GO

PRINT 'Successfully updated WarehouseQuotes table to allow NULL CustomerId';
GO
