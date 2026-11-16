
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
            "bike_photos": {
                  Row: {
                    "bike_id": string,"created_at": string,"id": string,"path": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "bike_id": string,"created_at"?: string,"id"?: string,"path": string,"sort_order"?: number
                  }
                  Update: {
                    "bike_id"?: string,"created_at"?: string,"id"?: string,"path"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "bike_photos_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bikes"
      referencedColumns: ["id"]
    }
                  ]
                },"bike_reviews": {
                  Row: {
                    "bike_id": string,"booking_id": string,"comment": string | null,"created_at": string,"id": string,"rating": number,"status": Database["public"]['Enums']["review_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bike_id": string,"booking_id": string,"comment"?: string | null,"created_at"?: string,"id"?: string,"rating": number,"status"?: Database["public"]['Enums']["review_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "bike_id"?: string,"booking_id"?: string,"comment"?: string | null,"created_at"?: string,"id"?: string,"rating"?: number,"status"?: Database["public"]['Enums']["review_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bike_reviews_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bikes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bike_reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bike_reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"bike_unavailable_periods": {
                  Row: {
                    "bike_id": string,"created_at": string,"ends_at": string,"id": string,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bike_id": string,"created_at"?: string,"ends_at": string,"id"?: string,"starts_at": string
                  }
                  Update: {
                    "bike_id"?: string,"created_at"?: string,"ends_at"?: string,"id"?: string,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bike_unavailable_periods_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bikes"
      referencedColumns: ["id"]
    }
                  ]
                },"bikes": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"description": string | null,"id": string,"is_available": boolean,"is_paused": boolean,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_available"?: boolean,"is_paused"?: boolean,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_available"?: boolean,"is_paused"?: boolean,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"bookings": {
                  Row: {
                    "admin_note": string | null,"bike_id": string,"comment": string | null,"created_at": string,"decline_reason": string | null,"deposit": number | null,"ends_at": string,"id": string,"paid_at": string | null,"payment_method": Database["public"]['Enums']["payment_method"] | null,"picked_up_at": string | null,"plan_id": string | null,"price": number,"returned_at": string | null,"starts_at": string,"status": Database["public"]['Enums']["booking_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"bike_id": string,"comment"?: string | null,"created_at"?: string,"decline_reason"?: string | null,"deposit"?: number | null,"ends_at": string,"id"?: string,"paid_at"?: string | null,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"picked_up_at"?: string | null,"plan_id"?: string | null,"price": number,"returned_at"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["booking_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "admin_note"?: string | null,"bike_id"?: string,"comment"?: string | null,"created_at"?: string,"decline_reason"?: string | null,"deposit"?: number | null,"ends_at"?: string,"id"?: string,"paid_at"?: string | null,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"picked_up_at"?: string | null,"plan_id"?: string | null,"price"?: number,"returned_at"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["booking_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_bike_id_fkey"
      columns: ["bike_id"]
isOneToOne: false
      referencedRelation: "bikes"
      referencedColumns: ["id"]
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
                    "created_at": string,"duration_count": number,"duration_unit": Database["public"]['Enums']["duration_unit"],"id": string,"is_active": boolean,"name": string,"price": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"duration_count": number,"duration_unit": Database["public"]['Enums']["duration_unit"],"id"?: string,"is_active"?: boolean,"name": string,"price": number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"duration_count"?: number,"duration_unit"?: Database["public"]['Enums']["duration_unit"],"id"?: string,"is_active"?: boolean,"name"?: string,"price"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rental_settings": {
                  Row: {
                    "first_start_minute": number,"id": boolean,"is_round_the_clock": boolean,"last_start_minute": number,"support_phone": string | null,"support_username": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "first_start_minute"?: number,"id"?: boolean,"is_round_the_clock"?: boolean,"last_start_minute"?: number,"support_phone"?: string | null,"support_username"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "first_start_minute"?: number,"id"?: boolean,"is_round_the_clock"?: boolean,"last_start_minute"?: number,"support_phone"?: string | null,"support_username"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"users": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"language_code": string | null,"locale": string | null,"phone": string | null,"photo_url": string | null,"role": Database["public"]['Enums']["user_role"],"telegram_id": number,"updated_at": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id"?: string,"language_code"?: string | null,"locale"?: string | null,"phone"?: string | null,"photo_url"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"telegram_id": number,"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"language_code"?: string | null,"locale"?: string | null,"phone"?: string | null,"photo_url"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"telegram_id"?: number,"updated_at"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "confirm_booking":
{ Args: { "p_booking_id": string }; Returns: string[]
                           },
"save_bike":
{ Args: { "p_bike_id": string,"p_deleted_period_ids": (string)[],"p_description": string,"p_is_available": boolean,"p_is_paused": boolean,"p_name": string,"p_new_periods": Json,"p_photos": Json }; Returns: string[]
                           }
          }
          Enums: {
            "booking_status": "pending"|"confirmed"|"active"|"completed"|"cancelled"|"rejected","duration_unit": "hour"|"day"|"week"|"month","payment_method": "cash"|"card"|"blik","review_status": "pending"|"approved"|"hidden","user_role": "customer"|"admin"
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
            "booking_status": ["pending", "confirmed", "active", "completed", "cancelled", "rejected"],"duration_unit": ["hour", "day", "week", "month"],"payment_method": ["cash", "card", "blik"],"review_status": ["pending", "approved", "hidden"],"user_role": ["customer", "admin"]
          }
        }
} as const
