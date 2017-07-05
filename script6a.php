<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT `panden`.`PandID` FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="script5b.php" method="post">
Kies een artikelnummer:<br />
<select name="panden">
<?php
while(list($PandID) = mysql_fetch_row($resultaat))
{
print("<option value='$PandID'>$PandID</option>");
}
?> 
</select><br />
<input type="submit" value="Verzend" />
</form>

