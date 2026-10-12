using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConvertThemeColorToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ThemeColor",
                table: "Workspaces",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Blue",
                oldClrType: typeof(string),
                oldType: "character varying(7)",
                oldMaxLength: 7,
                oldDefaultValue: "#3b82f6");

            migrationBuilder.AlterColumn<string>(
                name: "ThemeColor",
                table: "Projects",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Blue",
                oldClrType: typeof(string),
                oldType: "character varying(7)",
                oldMaxLength: 7,
                oldDefaultValue: "#3b82f6");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ThemeColor",
                table: "Workspaces",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#3b82f6",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Blue");

            migrationBuilder.AlterColumn<string>(
                name: "ThemeColor",
                table: "Projects",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#3b82f6",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Blue");
        }
    }
}
