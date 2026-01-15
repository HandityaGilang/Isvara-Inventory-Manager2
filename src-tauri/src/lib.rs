use serde::{Deserialize, Serialize};
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Debug, Serialize, Deserialize)]
struct InventoryItemDto {
    seller_sku: String,
    product_name: String,
    category: String,
    status: String,
    size_s: i64,
    size_m: i64,
    size_l: i64,
    size_xl: i64,
    size_xxl: i64,
    size_xxxl: i64,
    size_one_size: i64,
    recommended_listing_price: i64,
    nett_receive_zalora: i64,
    nett_receive_shopee: i64,
}

#[tauri::command]
async fn get_inventory_items(
    db: tauri::State<tauri_plugin_sql::Database>,
) -> Result<Vec<InventoryItemDto>, String> {
    let rows = db
        .select::<Vec<InventoryItemDto>>(
            "SELECT seller_sku, product_name, category, status, size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_one_size, recommended_listing_price, nett_receive_zalora, nett_receive_shopee FROM inventory_items ORDER BY seller_sku",
            [],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
async fn upsert_inventory_items(
    db: tauri::State<tauri_plugin_sql::Database>,
    items: Vec<InventoryItemDto>,
    duplicate_mode: String,
) -> Result<(), String> {
    let mut tx = db
        .execute("BEGIN TRANSACTION", [])
        .await
        .map_err(|e| e.to_string())?;

    let overwrite = duplicate_mode == "overwrite";

    for item in items {
        if overwrite {
            db.execute(
                "INSERT INTO inventory_items (seller_sku, product_name, category, status, size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_one_size, recommended_listing_price, nett_receive_zalora, nett_receive_shopee)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
                 ON CONFLICT(seller_sku) DO UPDATE SET
                   product_name = excluded.product_name,
                   category = excluded.category,
                   status = excluded.status,
                   size_s = excluded.size_s,
                   size_m = excluded.size_m,
                   size_l = excluded.size_l,
                   size_xl = excluded.size_xl,
                   size_xxl = excluded.size_xxl,
                   size_xxxl = excluded.size_xxxl,
                   size_one_size = excluded.size_one_size,
                   recommended_listing_price = excluded.recommended_listing_price,
                   nett_receive_zalora = excluded.nett_receive_zalora,
                   nett_receive_shopee = excluded.nett_receive_shopee",
                [
                    &item.seller_sku,
                    &item.product_name,
                    &item.category,
                    &item.status,
                    &item.size_s,
                    &item.size_m,
                    &item.size_l,
                    &item.size_xl,
                    &item.size_xxl,
                    &item.size_xxxl,
                    &item.size_one_size,
                    &item.recommended_listing_price,
                    &item.nett_receive_zalora,
                    &item.nett_receive_shopee,
                ],
            )
            .await
            .map_err(|e| e.to_string())?;
        } else {
            db.execute(
                "INSERT OR IGNORE INTO inventory_items (seller_sku, product_name, category, status, size_s, size_m, size_l, size_xl, size_xxl, size_xxxl, size_one_size, recommended_listing_price, nett_receive_zalora, nett_receive_shopee)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                [
                    &item.seller_sku,
                    &item.product_name,
                    &item.category,
                    &item.status,
                    &item.size_s,
                    &item.size_m,
                    &item.size_l,
                    &item.size_xl,
                    &item.size_xxl,
                    &item.size_xxxl,
                    &item.size_one_size,
                    &item.recommended_listing_price,
                    &item.nett_receive_zalora,
                    &item.nett_receive_shopee,
                ],
            )
            .await
            .map_err(|e| e.to_string())?;
        }
    }

    let _ = tx;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:inventory.db",
                    vec![Migration {
                        version: 1,
                        description: "create inventory table",
                        kind: MigrationKind::Up,
                        sql: r#"
                            CREATE TABLE IF NOT EXISTS inventory_items (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                seller_sku TEXT NOT NULL UNIQUE,
                                product_name TEXT NOT NULL,
                                category TEXT NOT NULL,
                                status TEXT NOT NULL,
                                size_s INTEGER NOT NULL DEFAULT 0,
                                size_m INTEGER NOT NULL DEFAULT 0,
                                size_l INTEGER NOT NULL DEFAULT 0,
                                size_xl INTEGER NOT NULL DEFAULT 0,
                                size_xxl INTEGER NOT NULL DEFAULT 0,
                                size_xxxl INTEGER NOT NULL DEFAULT 0,
                                size_one_size INTEGER NOT NULL DEFAULT 0,
                                recommended_listing_price INTEGER NOT NULL DEFAULT 0,
                                nett_receive_zalora INTEGER NOT NULL DEFAULT 0,
                                nett_receive_shopee INTEGER NOT NULL DEFAULT 0
                            );
                        "#.into(),
                    }],
                )
                .build(),
        )
        .manage(tauri_plugin_sql::Database::new("sqlite:inventory.db"))
        .invoke_handler(tauri::generate_handler![
            get_inventory_items,
            upsert_inventory_items
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
