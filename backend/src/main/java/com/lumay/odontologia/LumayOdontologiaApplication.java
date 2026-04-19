package com.lumay.odontologia;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.*;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@OpenAPIDefinition(info = @Info(title="Lumay Odontologia API", version="1.0.0", description="Sistema de gestão clínica", contact=@Contact(name="Lumay Odontologia", email="contato@lumayodontologia.com.br")))
@SecurityScheme(name="bearerAuth", type=SecuritySchemeType.HTTP, scheme="bearer", bearerFormat="JWT")
public class LumayOdontologiaApplication {
    public static void main(String[] args) { SpringApplication.run(LumayOdontologiaApplication.class, args); }
}
