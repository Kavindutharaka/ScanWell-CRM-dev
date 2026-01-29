-- SQL Script to create the destination_rates table
-- This table stores rates with format: DESTINATION, LINER, 20GP, 40HQ, TT/ROUTING, VALID
-- Used for Destination Header's categories: USEC/USWC HEADERS, CANADA HEADERS, JEBAL ALI HEADERS, EU/UK HEADERS

CREATE TABLE [dbo].[destination_rates] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [destination] NVARCHAR(255) NULL,
    [liner] NVARCHAR(255) NULL,
    [gp20] DECIMAL(18,2) NULL,
    [hq40] DECIMAL(18,2) NULL,
    [tt_routing] NVARCHAR(255) NULL,
    [valid] DATE NULL,
    [category] NVARCHAR(100) NULL,
    [remark] NVARCHAR(500) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [updated_at] DATETIME DEFAULT GETDATE()
);

-- Create index on category for faster lookups
CREATE INDEX IX_destination_rates_category ON [dbo].[destination_rates] ([category]);

-- Create index on destination for search
CREATE INDEX IX_destination_rates_destination ON [dbo].[destination_rates] ([destination]);
