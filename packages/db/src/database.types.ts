
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bike_price_overrides": {
                  Row: {
                    "bike_id": string,"created_at": string,"plan_id": string,"price": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bike_id": string,"created_at"?: string,"plan_id": string,"price": number,"updated_at"?: string
                  }
                  Update: {
                    "bike_id"?: string,"created_at"?: string,"plan_id"?: string,"price"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bike_price_overrides_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bike_plan_prices"
      referencedColumns: ["bike_id"]
    },{
      foreignKeyName: "bike_price_overrides_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bikes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bike_price_overrides_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "bike_plan_prices"
      referencedColumns: ["plan_id"]
    },{
      foreignKeyName: "bike_price_overrides_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "rental_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"bikes": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_available": boolean,"name": string,"photo_url": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_available"?: boolean,"name": string,"photo_url"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_available"?: boolean,"name"?: string,"photo_url"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"bookings": {
                  Row: {
                    "admin_note": string | null,"bike_id": string,"comment": string | null,"created_at": string,"deposit": number | null,"ends_at": string,"id": string,"paid_at": string | null,"payment_method": Database["public"]['Enums']["payment_method"] | null,"picked_up_at": string | null,"plan_id": string | null,"price": number,"returned_at": string | null,"starts_at": string,"status": Database["public"]['Enums']["booking_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"bike_id": string,"comment"?: string | null,"created_at"?: string,"deposit"?: number | null,"ends_at": string,"id"?: string,"paid_at"?: string | null,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"picked_up_at"?: string | null,"plan_id"?: string | null,"price": number,"returned_at"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["booking_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "admin_note"?: string | null,"bike_id"?: string,"comment"?: string | null,"created_at"?: string,"deposit"?: number | null,"ends_at"?: string,"id"?: string,"paid_at"?: string | null,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"picked_up_at"?: string | null,"plan_id"?: string | null,"price"?: number,"returned_at"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["booking_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bike_plan_prices"
      referencedColumns: ["bike_id"]
    },{
      foreignKeyName: "bookings_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bikes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "bike_plan_prices"
      referencedColumns: ["plan_id"]
    },{
      foreignKeyName: "bookings_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "rental_plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"rental_plans": {
                  Row: {
                    "created_at": string,"duration": string,"id": string,"is_active": boolean,"name": string,"price": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"duration": string,"id"?: string,"is_active"?: boolean,"name": string,"price": number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"duration"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"price"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"users": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"language_code": string | null,"phone": string | null,"role": Database["public"]['Enums']["user_role"],"telegram_id": number,"updated_at": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id"?: string,"language_code"?: string | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"telegram_id": number,"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"language_code"?: string | null,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"telegram_id"?: number,"updated_at"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "bike_plan_prices": {
                  Row: {
                    "bike_id": string,"duration": string,"is_override": boolean | null,"plan_id": string,"plan_name": string,"price": number | null,"sort_order": number
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "booking_status": "pending"|"confirmed"|"active"|"completed"|"cancelled","payment_method": "cash"|"card"|"blik","user_role": "customer"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "booking_status": ["pending", "confirmed", "active", "completed", "cancelled"],"payment_method": ["cash", "card", "blik"],"user_role": ["customer", "admin"]
          }
        }
} as const
